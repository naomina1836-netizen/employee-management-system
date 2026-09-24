CREATE TABLE IF NOT EXISTS departments (
  department_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS positions (
  position_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  department_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_positions_department FOREIGN KEY (department_id)
    REFERENCES departments(department_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employees (
  employee_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20) NOT NULL DEFAULT 'Male',
  phone VARCHAR(30) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  address TEXT NULL,
  date_of_birth DATE NULL,
  hire_date DATE NULL,
  department_id INT UNSIGNED NULL,
  position_id INT UNSIGNED NULL,
  manager_id INT UNSIGNED NULL,
  employment_status VARCHAR(30) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_employees_department FOREIGN KEY (department_id)
    REFERENCES departments(department_id) ON DELETE SET NULL,
  CONSTRAINT fk_employees_position FOREIGN KEY (position_id)
    REFERENCES positions(position_id) ON DELETE SET NULL,
  CONSTRAINT fk_employees_manager FOREIGN KEY (manager_id)
    REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'Employee',
  employee_id INT UNSIGNED NULL UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'Active',
  password_setup_token_hash VARCHAR(255) NULL,
  password_setup_expires_at DATETIME NULL,
  password_setup_requested_at DATETIME NULL,
  password_setup_completed_at DATETIME NULL,
  password_reset_token_hash VARCHAR(255) NULL,
  password_reset_expires_at DATETIME NULL,
  password_reset_requested_at DATETIME NULL,
  password_reset_completed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_employee FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS leave_types (
  leave_type_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  leave_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  max_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS leave_requests (
  leave_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED NOT NULL,
  leave_type_id INT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT UNSIGNED NOT NULL,
  reason TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  approved_by INT UNSIGNED NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_type FOREIGN KEY (leave_type_id)
    REFERENCES leave_types(leave_type_id),
  CONSTRAINT fk_leave_approver FOREIGN KEY (approved_by)
    REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attendance (
  attendance_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED NOT NULL,
  attendance_date DATE NOT NULL,
  check_in TIME NULL,
  check_out TIME NULL,
  hours_worked DECIMAL(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'Present',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance_employee_date (employee_id, attendance_date),
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payroll (
  payroll_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED NOT NULL,
  month VARCHAR(20) NOT NULL,
  year SMALLINT UNSIGNED NOT NULL,
  basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
  overtime DECIMAL(12,2) NOT NULL DEFAULT 0,
  deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payroll_employee_period (employee_id, month, year),
  CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS performance_reviews (
  review_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED NOT NULL,
  reviewer_id INT UNSIGNED NOT NULL,
  review_date DATE NOT NULL,
  teamwork_score DECIMAL(4,2) NULL,
  communication_score DECIMAL(4,2) NULL,
  productivity_score DECIMAL(4,2) NULL,
  punctuality_score DECIMAL(4,2) NULL,
  leadership_score DECIMAL(4,2) NULL,
  comments TEXT NULL,
  overall_score DECIMAL(4,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_employee FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id)
    REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INT UNSIGNED NULL,
  details TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO leave_types (leave_name, description, max_days) VALUES
  ('Annual Leave', 'Paid annual leave', 21),
  ('Sick Leave', 'Medical leave', 14),
  ('Maternity Leave', 'Maternity leave', 90),
  ('Paternity Leave', 'Paternity leave', 10),
  ('Unpaid Leave', 'Unpaid leave', 0);
