const db = require("../config/db");

async function getHrContext(user) {
  const [employees] = await db.query(
    "SELECT COUNT(*) AS total FROM employees WHERE employment_status = 'Active'"
  );
  const [pendingLeaves] = await db.query(
    "SELECT COUNT(*) AS total FROM leave_requests WHERE status = 'Pending'"
  );
  const [todayAtt] = await db.query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
            SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late,
            SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) AS half_day,
            ROUND(AVG(hours_worked), 2) AS avg_hours
     FROM attendance WHERE attendance_date = CURDATE()`
  );
  const [depts] = await db.query(
    `SELECT d.department_name, COUNT(e.employee_id) AS count
     FROM departments d
     LEFT JOIN employees e ON e.department_id = d.department_id AND e.employment_status = 'Active'
     GROUP BY d.department_id ORDER BY count DESC LIMIT 5`
  );
  const [leaveTypes] = await db.query(
    "SELECT leave_name, max_days FROM leave_types ORDER BY leave_type_id"
  );

  let myLeaveBalance = null;
  if (user?.employee_id) {
    const year = new Date().getFullYear();
    const [types] = await db.query(
      "SELECT leave_type_id, leave_name, max_days FROM leave_types"
    );
    const [used] = await db.query(
      `SELECT leave_type_id, COALESCE(SUM(total_days), 0) AS used_days
       FROM leave_requests
       WHERE employee_id = ? AND status = 'Approved' AND YEAR(start_date) = ?
       GROUP BY leave_type_id`,
      [user.employee_id, year]
    );
    const usedMap = Object.fromEntries(used.map((r) => [r.leave_type_id, Number(r.used_days)]));
    myLeaveBalance = types.map((t) => ({
      leave_name: t.leave_name,
      max_days: t.max_days,
      used_days: usedMap[t.leave_type_id] || 0,
      remaining_days: Math.max(0, t.max_days - (usedMap[t.leave_type_id] || 0))
    }));
  }

  return {
    totalEmployees: employees[0]?.total || 0,
    pendingLeaves: pendingLeaves[0]?.total || 0,
    todayAttendance: todayAtt[0] || {},
    topDepartments: depts,
    leaveTypes,
    myLeaveBalance,
    userRole: user?.role || null,
    userEmployeeId: user?.employee_id || null
  };
}

function systemPrompt(role, context) {
  return `You are DENY AI, the professional assistant for D.E.N.Y HRMS (Human Resource Management System).
User role: ${role || "Employee"}.
Live system context (JSON): ${JSON.stringify(context)}

Rules:
- Be concise, clear, and actionable.
- Return plain text only. Do not use any markdown formatting like asterisks, bold, italics, or bullet symbols. Use dashes (-) for lists if needed.
- Guide users through this app's modules: Dashboard, Employees, Leave, Attendance, Payroll, Performance, Reports, Profile.
- Respect roles: Employees only do self-service; Managers approve leave and reviews; HR/Admin manage people and payroll.
- Do not invent private employee details beyond the provided context.
- If unsure, say which screen to open in D.E.N.Y HRMS.
- Attendance rules in this system: hours = check-out minus check-in same day; Late if check-in at/after 09:00; Half Day if hours worked < 4.`;
}

function localAssistant(message, role, context) {
  const q = (message || "").toLowerCase().trim();
  const lines = [];

  if (!q) {
    return "Ask me about employees, leave, attendance, payroll, performance, or how to use D.E.N.Y HRMS.";
  }

  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))\b/.test(q)) {
    return `Hello! I'm DENY AI for D.E.N.Y HRMS. Active employees: ${context.totalEmployees}. Pending leave: ${context.pendingLeaves}. How can I help?`;
  }

  if (/employee|headcount|staff|workforce|team size/.test(q)) {
    lines.push(`There are ${context.totalEmployees} active employees.`);
    if (context.topDepartments?.length) {
      lines.push("Top departments:");
      context.topDepartments.forEach((d) => lines.push(`- ${d.department_name}: ${d.count}`));
    }
    if (role === "Employee") {
      lines.push("You can update your profile and request leave for yourself only.");
    } else {
      lines.push("Manage people under Employees.");
    }
    return lines.join("\n");
  }

  if (/leave|vacation|time\s*off|pto|balance/.test(q)) {
    lines.push(`Pending leave requests (all staff): ${context.pendingLeaves}.`);
    if (context.myLeaveBalance?.length) {
      lines.push("Your leave balance this year:");
      context.myLeaveBalance.forEach((b) => {
        lines.push(`- ${b.leave_name}: ${b.remaining_days} left of ${b.max_days} (used ${b.used_days})`);
      });
    } else if (context.leaveTypes?.length) {
      lines.push("Leave types:");
      context.leaveTypes.forEach((t) => lines.push(`- ${t.leave_name}: up to ${t.max_days} days`));
    }
    lines.push("Request leave via Leave -> Request leave.");
    return lines.join("\n");
  }

  if (/attend|check.?in|check.?out|hours|late|absent/.test(q)) {
    const a = context.todayAttendance || {};
    lines.push("Today's attendance:");
    lines.push(`- Records: ${a.total || 0}`);
    lines.push(`- Present: ${a.present || 0} - Late: ${a.late || 0} - Half day: ${a.half_day || 0} - Absent: ${a.absent || 0}`);
    if (a.avg_hours != null) lines.push(`- Avg hours today: ${a.avg_hours}`);
    lines.push("Hours = check-out - check-in (same day). Check-in at/after 09:00 -> Late. Under 4 hours -> Half Day.");
    if (role === "Employee") lines.push("Use Attendance (Self) to check in/out.");
    return lines.join("\n");
  }

  if (/payroll|salary|pay|wage/.test(q)) {
    return [
      "Payroll is under Payroll.",
      "HR/Admin create and edit payslips. Employees can only view their own.",
      "Fields: basic, allowance, overtime, deduction, tax, net."
    ].join("\n");
  }

  if (/performance|review|rating|score/.test(q)) {
    return [
      "Performance scores are 1-5 for teamwork, communication, productivity, punctuality, leadership.",
      "Overall = average of those five scores (not a sum).",
      "Managers/HR create reviews; employees view their own."
    ].join("\n");
  }

  if (/how (do|to)|help|guide|where|what can i/.test(q)) {
    if (role === "Employee") {
      return [
        "As an Employee you can:",
        "- Request leave (yourself only)",
        "- Check in/out under Attendance (Self)",
        "- View your payroll and performance",
        "- Edit profile / password",
        "You cannot manage other people, approve leave, or edit payroll."
      ].join("\n");
    }
    return [
      "Quick guide:",
      "- Dashboard - KPIs and AI insights",
      "- Employees - directory (Admin/HR/Manager)",
      "- Leave - request / approve",
      "- Attendance - daily presence and self check-in",
      "- Payroll / Performance / Reports - by role",
      `You are signed in as ${role || "User"}.`
    ].join("\n");
  }

  if (/role|permission|access|who can/.test(q)) {
    return [
      "Roles in D.E.N.Y HRMS:",
      "- Admin - full access, user management",
      "- HR - people, leave, payroll, users",
      "- Manager - approve leave, performance, team visibility",
      "- Employee - self-service only",
      `Your role: ${role || "Unknown"}.`
    ].join("\n");
  }

  return [
    "I'm DENY AI for D.E.N.Y HRMS - leave, attendance, payroll, performance, and navigation.",
    `Live: ${context.totalEmployees} employees, ${context.pendingLeaves} pending leaves.`,
    role === "Employee"
      ? 'Try: "My leave balance" or "How do I check in?"'
      : 'Try: "Attendance today" or "What can Managers do?"'
  ].join("\n");
}

async function callChatCompletions({ url, apiKey, model, message, role, context }) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt(role, context) },
        { role: "user", content: message }
      ]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("LLM error:", url, res.status, errText.slice(0, 300));
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

async function callGemini(message, role, context) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt(role, context)}\n\nUser question: ${message}` }]
        }
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini error:", res.status, errText.slice(0, 300));
    return null;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || null;
  return text?.trim() || null;
}

async function callGroq(message, role, context) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return callChatCompletions({
    url: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: key,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    message,
    role,
    context
  });
}

async function callOpenAI(message, role, context) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return callChatCompletions({
    url: "https://api.openai.com/v1/chat/completions",
    apiKey: key,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    message,
    role,
    context
  });
}

async function generateReply(message, role, context) {
  const providers = [
    { name: "groq", fn: callGroq },
    { name: "gemini", fn: callGemini },
    { name: "openai", fn: callOpenAI }
  ];

  for (const p of providers) {
    try {
      const reply = await p.fn(message, role, context);
      if (reply) return { reply, provider: p.name };
    } catch (e) {
      console.error(`${p.name} failed:`, e.message);
    }
  }

  return { reply: localAssistant(message, role, context), provider: "local" };
}

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const context = await getHrContext(req.user);
    const role = req.user?.role;
    const { reply, provider } = await generateReply(String(message).slice(0, 2000), role, context);

    res.json({
      reply,
      provider,
      context: {
        totalEmployees: context.totalEmployees,
        pendingLeaves: context.pendingLeaves
      }
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ message: "Assistant is temporarily unavailable", detail: error.message });
  }
};

exports.insights = async (req, res) => {
  try {
    const context = await getHrContext(req.user);
    const insights = [];

    if (context.pendingLeaves > 5) {
      insights.push({
        type: "warning",
        title: "Leave backlog",
        text: `${context.pendingLeaves} leave requests are pending review.`
      });
    } else if (context.pendingLeaves > 0) {
      insights.push({
        type: "info",
        title: "Pending leave",
        text: `${context.pendingLeaves} leave request(s) awaiting action.`
      });
    } else {
      insights.push({
        type: "success",
        title: "Leave queue clear",
        text: "No pending leave requests."
      });
    }

    const a = context.todayAttendance || {};
    const late = Number(a.late || 0);
    const absent = Number(a.absent || 0);
    if (late + absent > 3) {
      insights.push({
        type: "warning",
        title: "Attendance attention",
        text: `Today: ${late} late, ${absent} absent (avg hours ${a.avg_hours ?? "-"}).`
      });
    } else {
      insights.push({
        type: "success",
        title: "Attendance steady",
        text: `Today: ${a.present || 0} present, ${a.total || 0} records.`
      });
    }

    insights.push({
      type: "tip",
      title: "DENY AI",
      text: process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
        ? "Cloud AI is enabled. Ask anything about D.E.N.Y HRMS."
        : "Running on local assistant. Add GROQ_API_KEY or GEMINI_API_KEY for stronger answers (free tiers available)."
    });

    res.json({ insights, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("AI insights error:", error);
    res.status(500).json({ message: "Failed to generate insights" });
  }
};