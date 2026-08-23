






function isPrivileged(role) {
  return role === "Admin" || role === "HR";
}

function isStaff(role) {
  return role === "Admin" || role === "HR" || role === "Manager";
}




function canAccessEmployee(user, targetEmployeeId) {
  if (!user) return false;
  if (isPrivileged(user.role)) return true;
  if (user.role === "Employee") {
    return user.employee_id != null && Number(user.employee_id) === Number(targetEmployeeId);
  }

  if (user.role === "Manager") {
    if (user.employee_id != null && Number(user.employee_id) === Number(targetEmployeeId)) {
      return true;
    }

    return true;
  }
  return false;
}




function canModifyEmployee(user, targetEmployeeId) {
  if (!user) return false;
  if (isPrivileged(user.role)) return true;
  return user.employee_id != null && Number(user.employee_id) === Number(targetEmployeeId);
}




function denyAccess(res, message = "You can only access your own records") {
  return res.status(403).json({ message });
}

module.exports = {
  isPrivileged,
  isStaff,
  canAccessEmployee,
  canModifyEmployee,
  denyAccess
};