CREATE DATABASE IF NOT EXISTS hrm_db;
USE hrm_db;
-- 1. USERS TABLE (Authentication)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'HR', 'Manager', 'Employee') DEFAULT 'Employee',
    employee_id INT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    password_setup_token_hash VARCHAR(255) NULL,
    password_setup_expires_at DATETIME NULL,
    password_setup_requested_at DATETIME NULL,
    password_setup_completed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_employee (employee_id)
);
-- 2. DEPARTMENTS TABLE
CREATE TABLE departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_department_name (department_name)
);
-- 3. POSITIONS TABLE
CREATE TABLE positions (
    position_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    basic_salary DECIMAL(10,2) DEFAULT 0.00,
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    INDEX idx_title (title),
    INDEX idx_department (department_id)
);
-- 4. EMPLOYEES TABLE
CREATE TABLE employees (
    employee_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender ENUM('Male', 'Female') DEFAULT 'Male',
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    date_of_birth DATE,
    hire_date DATE,
    department_id INT,
    position_id INT,
    manager_id INT,
    profile_picture VARCHAR(255),
    employment_status ENUM('Active', 'Resigned', 'Terminated') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    FOREIGN KEY (position_id) REFERENCES positions(position_id) ON DELETE SET NULL,
    FOREIGN KEY (manager_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_department (department_id),
    INDEX idx_position (position_id),
    INDEX idx_manager (manager_id),
    INDEX idx_status (employment_status)
);

-- Link users.employee_id to employees (added after employees exists)
ALTER TABLE users
    ADD CONSTRAINT fk_users_employee
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL;
-- 5. ATTENDANCE TABLE
CREATE TABLE attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    hours_worked DECIMAL(4,2) DEFAULT 0.00,
    status ENUM('Present', 'Absent', 'Late', 'Half Day') DEFAULT 'Present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_date (attendance_date),
    INDEX idx_status (status),
    UNIQUE KEY unique_attendance (employee_id, attendance_date)
);
-- 6. LEAVE TYPES TABLE
CREATE TABLE leave_types (
    leave_type_id INT PRIMARY KEY AUTO_INCREMENT,
    leave_name VARCHAR(50) NOT NULL,
    max_days INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_leave_name (leave_name)
);
-- 7. LEAVE REQUESTS TABLE
CREATE TABLE leave_requests (
    leave_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approved_by INT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(leave_type_id),
    FOREIGN KEY (approved_by) REFERENCES employees(employee_id) ON DELETE SET NULL,
    INDEX idx_employee (employee_id),
    INDEX idx_leave_type (leave_type_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
);
-- 8. PAYROLL TABLE
CREATE TABLE payroll (
    payroll_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    year YEAR NOT NULL,
    basic_salary DECIMAL(10,2) DEFAULT 0.00,
    allowance DECIMAL(10,2) DEFAULT 0.00,
    overtime DECIMAL(10,2) DEFAULT 0.00,
    deduction DECIMAL(10,2) DEFAULT 0.00,
    tax DECIMAL(10,2) DEFAULT 0.00,
    net_salary DECIMAL(10,2) DEFAULT 0.00,
    payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_month_year (month, year),
    UNIQUE KEY unique_payroll (employee_id, month, year)
);
-- 9. PERFORMANCE REVIEWS TABLE
CREATE TABLE performance_reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    review_date DATE NOT NULL,
    teamwork_score INT CHECK (teamwork_score BETWEEN 1 AND 5),
    communication_score INT CHECK (communication_score BETWEEN 1 AND 5),
    productivity_score INT CHECK (productivity_score BETWEEN 1 AND 5),
    punctuality_score INT CHECK (punctuality_score BETWEEN 1 AND 5),
    leadership_score INT CHECK (leadership_score BETWEEN 1 AND 5),
    comments TEXT,
    overall_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_reviewer (reviewer_id),
    INDEX idx_date (review_date)
);
-- 10. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read)
);
-- 11. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_table (table_name),
    INDEX idx_time (action_time)
);

-- SAMPLE DATA
-- Departments
INSERT INTO departments (department_name, description) VALUES
('Information Technology', 'IT Department handling software, hardware, and networks'),
('Human Resources', 'HR Department managing employees, recruitment, and benefits'),
('Finance', 'Finance Department handling accounting, payroll, and budgeting'),
('Marketing', 'Marketing Department handling campaigns, branding, and communications'),
('Operations', 'Operations Department managing day-to-day business activities');

-- Positions
INSERT INTO positions (title, basic_salary, department_id) VALUES
('Software Developer', 80000.00, 1),
('Senior Developer', 120000.00, 1),
('IT Manager', 150000.00, 1),
('HR Assistant', 50000.00, 2),
('HR Manager', 130000.00, 2),
('Accountant', 70000.00, 3),
('Finance Manager', 140000.00, 3),
('Marketing Officer', 60000.00, 4),
('Marketing Manager', 135000.00, 4),
('Operations Manager', 145000.00, 5);

-- Leave Types
INSERT INTO leave_types (leave_name, max_days) VALUES
('Annual Leave', 20),
('Sick Leave', 10),
('Maternity Leave', 90),
('Paternity Leave', 10),
('Emergency Leave', 5),
('Study Leave', 30);

-- Employees
INSERT INTO employees (first_name, last_name, gender, phone, email, address, date_of_birth, hire_date, department_id, position_id, employment_status) VALUES
-- IT Department
('Abebe', 'Kebede', 'Male', '+251 911 123 456', 'abebe.kebede@hrm.com', 'Addis Ababa, Ethiopia', '1990-05-15', '2018-03-01', 1, 2, 'Active'),
('Tigist', 'Haile', 'Female', '+251 922 234 567', 'tigist.haile@hrm.com', 'Addis Ababa, Ethiopia', '1992-08-20', '2019-06-15', 1, 1, 'Active'),
('Mekdes', 'Tesfaye', 'Female', '+251 933 345 678', 'mekdes.tesfaye@hrm.com', 'Addis Ababa, Ethiopia', '1993-11-10', '2020-01-10', 1, 1, 'Active'),
('Dawit', 'Solomon', 'Male', '+251 944 456 789', 'dawit.solomon@hrm.com', 'Addis Ababa, Ethiopia', '1988-03-25', '2017-09-01', 1, 3, 'Active'),
-- HR Department
('Helen', 'Alemayehu', 'Female', '+251 955 567 890', 'helen.alemayehu@hrm.com', 'Addis Ababa, Ethiopia', '1991-07-12', '2019-11-01', 2, 5, 'Active'),
('Samuel', 'Girma', 'Male', '+251 966 678 901', 'samuel.girma@hrm.com', 'Addis Ababa, Ethiopia', '1995-01-30', '2021-04-15', 2, 4, 'Active'),
-- Finance Department
('Meron', 'Worku', 'Female', '+251 977 789 012', 'meron.worku@hrm.com', 'Addis Ababa, Ethiopia', '1990-09-18', '2018-07-01', 3, 7, 'Active'),
('Yonas', 'Ayele', 'Male', '+251 988 890 123', 'yonas.ayele@hrm.com', 'Addis Ababa, Ethiopia', '1992-12-05', '2020-03-01', 3, 6, 'Active'),
-- Marketing Department
('Sara', 'Mohammed', 'Female', '+251 999 901 234', 'sara.mohammed@hrm.com', 'Addis Ababa, Ethiopia', '1994-04-22', '2020-09-01', 4, 9, 'Active'),
('Biruk', 'Tekle', 'Male', '+251 911 012 345', 'biruk.tekle@hrm.com', 'Addis Ababa, Ethiopia', '1996-06-14', '2021-07-01', 4, 8, 'Active'),
-- Operations Department
('Selam', 'Assefa', 'Female', '+251 922 123 456', 'selam.assefa@hrm.com', 'Addis Ababa, Ethiopia', '1989-10-08', '2018-11-01', 5, 10, 'Active');

-- Users (Password: password123 for all)
INSERT INTO users (username, email, password, role, employee_id) VALUES
('admin', 'admin@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'Admin', 1),
('abebe.k', 'abebe.kebede@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'Manager', 1),
('dawit.s', 'dawit.solomon@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'Manager', 4),
('helen.a', 'helen.alemayehu@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'HR', 5),
('meron.w', 'meron.worku@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'Manager', 7),
('tigist.h', 'tigist.haile@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'Employee', 2),
('mekdes.t', 'mekdes.tesfaye@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'Employee', 3),
('samuel.g', 'samuel.girma@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'Employee', 6),
('yonas.a', 'yonas.ayele@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'Employee', 8),
('sara.m', 'sara.mohammed@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'Employee', 9),
('biruk.t', 'biruk.tekle@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'Employee', 10),
('selam.a', 'selam.assefa@hrm.com', '$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i', 'Manager', 11);

-- Sample Attendance
INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, hours_worked, status) VALUES
(1, CURDATE() - INTERVAL 4 DAY, '08:00:00', '17:00:00', 8.00, 'Present'),
(1, CURDATE() - INTERVAL 3 DAY, '08:15:00', '17:00:00', 7.75, 'Late'),
(1, CURDATE() - INTERVAL 2 DAY, '08:00:00', '17:30:00', 8.50, 'Present'),
(2, CURDATE() - INTERVAL 4 DAY, '08:00:00', '17:00:00', 8.00, 'Present'),
(2, CURDATE() - INTERVAL 3 DAY, '08:00:00', '16:00:00', 6.00, 'Half Day'),
(2, CURDATE() - INTERVAL 2 DAY, NULL, NULL, 0.00, 'Absent');

-- Sample Leave Requests
INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status) VALUES
(2, 1, CURDATE() + INTERVAL 7 DAY, CURDATE() + INTERVAL 10 DAY, 4, 'Family vacation', 'Pending'),
(3, 2, CURDATE() + INTERVAL 14 DAY, CURDATE() + INTERVAL 15 DAY, 2, 'Doctor appointment', 'Approved'),
(6, 1, CURDATE() + INTERVAL 21 DAY, CURDATE() + INTERVAL 25 DAY, 5, 'Personal travel', 'Pending');

-- Sample Payroll
INSERT INTO payroll (employee_id, month, year, basic_salary, allowance, overtime, deduction, tax, net_salary, payment_date) VALUES
(1, 'January', 2026, 120000.00, 5000.00, 2000.00, 1000.00, 15000.00, 111000.00, '2026-01-25'),
(1, 'February', 2026, 120000.00, 5000.00, 1500.00, 1000.00, 14800.00, 109700.00, '2026-02-25'),
(2, 'January', 2026, 80000.00, 3000.00, 1000.00, 500.00, 9500.00, 74000.00, '2026-01-25'),
(2, 'February', 2026, 80000.00, 3000.00, 2000.00, 500.00, 9800.00, 74700.00, '2026-02-25');

-- Sample Performance Reviews
INSERT INTO performance_reviews (employee_id, reviewer_id, review_date, teamwork_score, communication_score, productivity_score, punctuality_score, leadership_score, comments, overall_score) VALUES
(2, 1, '2026-01-15', 4, 4, 5, 4, 3, 'Good performance, needs improvement in leadership', 4.00),
(3, 1, '2026-01-20', 5, 5, 4, 5, 4, 'Excellent team player', 4.60),
(6, 5, '2026-02-01', 3, 4, 4, 3, 2, 'Good work, needs more initiative', 3.20);

-- Sample Notifications
INSERT INTO notifications (user_id, title, message) VALUES
(2, 'Leave Request Status', 'Your leave request for Annual Leave has been approved.'),
(3, 'Leave Request Status', 'Your leave request for Sick Leave has been approved.'),
(6, 'Leave Request Status', 'Your leave request for Annual Leave is pending review.'),
(1, 'New Employee', 'A new employee has been added to the system.');

-- Sample Audit Logs
INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES
(1, 'INSERT', 'employees', 1),
(1, 'INSERT', 'users', 1),
(5, 'UPDATE', 'leave_requests', 1),
(1, 'INSERT', 'payroll', 1);
