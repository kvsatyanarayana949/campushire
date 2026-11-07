-- CampusHire Realistic Demonstration Seed Data
-- Demo Password for all seed users: Password@123
-- Hash: $2a$10$WLCUvt1qnt2YuvYd1.2Ee.iWK2Vg3KgGbJUFR4/SgcFKiaRVQmcpi

USE campushire_db;

-- Clear previous test data in child-to-parent order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE interviews;
TRUNCATE TABLE applications;
TRUNCATE TABLE jobs;
TRUNCATE TABLE student_skills;
TRUNCATE TABLE student_profiles;
TRUNCATE TABLE recruiter_profiles;
TRUNCATE TABLE companies;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Users
INSERT INTO users (id, name, email, password, role, is_active) VALUES
(1, 'System Administrator', 'admin@campushire.io', '$2a$10$WLCUvt1qnt2YuvYd1.2Ee.iWK2Vg3KgGbJUFR4/SgcFKiaRVQmcpi', 'ADMIN', TRUE),
(2, 'Priya Sharma (NexusCloud HR)', 'priya.sharma@nexuscloud.com', '$2a$10$WLCUvt1qnt2YuvYd1.2Ee.iWK2Vg3KgGbJUFR4/SgcFKiaRVQmcpi', 'RECRUITER', TRUE),
(3, 'Arjun Mehta (Apex FinTech Lead)', 'arjun.mehta@fintechlabs.io', '$2a$10$WLCUvt1qnt2YuvYd1.2Ee.iWK2Vg3KgGbJUFR4/SgcFKiaRVQmcpi', 'RECRUITER', TRUE),
(4, 'Sneha Patel (CyberNova Tech)', 'sneha.patel@cybernova.in', '$2a$10$WLCUvt1qnt2YuvYd1.2Ee.iWK2Vg3KgGbJUFR4/SgcFKiaRVQmcpi', 'RECRUITER', TRUE),
(5, 'Rohit Verma', 'rohit.verma@student.edu', '$2a$10$WLCUvt1qnt2YuvYd1.2Ee.iWK2Vg3KgGbJUFR4/SgcFKiaRVQmcpi', 'STUDENT', TRUE),
(6, 'Ananya Sen', 'ananya.sen@student.edu', '$2a$10$WLCUvt1qnt2YuvYd1.2Ee.iWK2Vg3KgGbJUFR4/SgcFKiaRVQmcpi', 'STUDENT', TRUE),
(7, 'Kavya Nair', 'kavya.nair@student.edu', '$2a$10$WLCUvt1qnt2YuvYd1.2Ee.iWK2Vg3KgGbJUFR4/SgcFKiaRVQmcpi', 'STUDENT', TRUE),
(8, 'Vikram Singh', 'vikram.singh@student.edu', '$2a$10$WLCUvt1qnt2YuvYd1.2Ee.iWK2Vg3KgGbJUFR4/SgcFKiaRVQmcpi', 'STUDENT', TRUE);

-- 2. Insert Companies
INSERT INTO companies (id, name, website, location, industry, description, logo_url, created_by) VALUES
(1, 'NexusCloud Technologies', 'https://nexuscloud.example.com', 'Bengaluru, India', 'Cloud Infrastructure & SaaS', 'Next-generation hyper-scale distributed cloud and enterprise monitoring platform.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop&crop=faces', 2),
(2, 'Apex FinTech Labs', 'https://fintechlabs.example.com', 'Mumbai, India', 'Financial Technology & Banking', 'Engineering high-frequency digital payment gateways, micro-lending protocols, and wealth analytics.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&h=128&fit=crop&crop=faces', 3),
(3, 'CyberNova Solutions', 'https://cybernova.example.com', 'Hyderabad, India', 'Cybersecurity & Defense', 'Specializing in Zero-Trust cloud architecture, vulnerability intelligence, and SIEM automated mitigation.', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&h=128&fit=crop&crop=faces', 4);

-- 3. Insert Recruiter Profiles
INSERT INTO recruiter_profiles (id, user_id, company_id, designation, phone) VALUES
(1, 2, 1, 'Head of Campus Talent Acquisition', '+91 98765 43210'),
(2, 3, 2, 'Senior Engineering Recruitment Manager', '+91 98765 43211'),
(3, 4, 3, 'Director of Human Capital', '+91 98765 43212');

-- 4. Insert Student Profiles
INSERT INTO student_profiles (id, user_id, roll_number, degree, department, cgpa, active_backlogs, graduation_year, phone, resume_url, bio) VALUES
(1, 5, '22CS1045', 'B.Tech', 'Computer Science & Engineering', 8.75, 0, 2026, '+91 91234 56780', 'https://drive.google.com/demo/rohit-resume.pdf', 'Passionate full-stack developer with hands-on experience in React, Node.js, Express, and MySQL databases.'),
(2, 6, '22IT1012', 'B.Tech', 'Information Technology', 7.40, 1, 2026, '+91 91234 56781', 'https://drive.google.com/demo/ananya-resume.pdf', 'Frontend enthusiast interested in responsive UI/UX engineering, Tailwind CSS, and web performance optimization.'),
(3, 7, '22EC1089', 'B.Tech', 'Electronics & Communication', 9.20, 0, 2026, '+91 91234 56782', 'https://drive.google.com/demo/kavya-resume.pdf', 'Academic topper interested in cloud architecture, backend microservices, distributed systems, and real-time APIs.'),
(4, 8, '21ME1033', 'B.Tech', 'Mechanical Engineering', 6.10, 2, 2025, '+91 91234 56783', 'https://drive.google.com/demo/vikram-resume.pdf', 'Transitioning into software engineering, building proficiency in core JavaScript, algorithms, and SQL basics.');

-- 5. Insert Student Skills
INSERT INTO student_skills (student_id, skill_name, proficiency) VALUES
(1, 'JavaScript', 'ADVANCED'),
(1, 'React', 'ADVANCED'),
(1, 'Node.js', 'INTERMEDIATE'),
(1, 'Express.js', 'INTERMEDIATE'),
(1, 'MySQL', 'INTERMEDIATE'),
(1, 'Tailwind CSS', 'ADVANCED'),
(2, 'HTML5', 'ADVANCED'),
(2, 'CSS3', 'ADVANCED'),
(2, 'JavaScript', 'INTERMEDIATE'),
(2, 'React', 'INTERMEDIATE'),
(2, 'Tailwind CSS', 'INTERMEDIATE'),
(3, 'Python', 'ADVANCED'),
(3, 'Java', 'ADVANCED'),
(3, 'Node.js', 'ADVANCED'),
(3, 'MySQL', 'ADVANCED'),
(3, 'Docker', 'INTERMEDIATE'),
(3, 'AWS', 'INTERMEDIATE'),
(4, 'Python', 'BEGINNER'),
(4, 'SQL', 'BEGINNER'),
(4, 'JavaScript', 'BEGINNER');

-- 6. Insert Jobs
INSERT INTO jobs (id, company_id, recruiter_id, title, description, job_type, location, salary_range, min_cgpa, max_backlogs, eligible_graduation_year, eligible_degrees, eligible_departments, required_skills, deadline, is_active) VALUES
(1, 1, 2, 'Associate Full Stack Software Engineer', 'Join our core platform engineering team to build scalable microservices and intuitive dashboard interfaces. You will collaborate with senior architects to implement robust REST APIs and responsive web apps.', 'FULL_TIME', 'Bengaluru, Karnataka (Hybrid)', '₹12,00,000 - ₹16,00,000 PA', 7.50, 0, 2026, 'B.Tech,M.Tech,MCA', 'Computer Science & Engineering,Information Technology,Electronics & Communication', 'React,Node.js,MySQL,JavaScript', '2026-12-31', TRUE),
(2, 1, 2, 'Cloud DevOps & Site Reliability Engineer', 'Responsible for modern CI/CD pipelines, container orchestration, automated infrastructure provisioning via Terraform, and 99.99% system availability monitoring.', 'FULL_TIME', 'Bengaluru, Karnataka', '₹14,00,000 - ₹18,00,000 PA', 8.00, 0, 2026, 'B.Tech,M.Tech', 'Computer Science & Engineering,Information Technology,Electronics & Communication', 'Docker,AWS,Python,Linux', '2026-11-30', TRUE),
(3, 2, 3, 'FinTech Backend API Engineer', 'Develop high-throughput transaction processing pipelines, secure REST endpoints, and low-latency database queries in our PCI-DSS certified environment.', 'FULL_TIME', 'Mumbai, Maharashtra', '₹11,00,000 - ₹15,00,000 PA', 7.00, 0, 2026, 'B.Tech,MCA,B.Sc', 'All Departments', 'Node.js,Express.js,MySQL,JavaScript', '2026-12-15', TRUE),
(4, 2, 3, 'Data Analytics & ML Research Intern', 'Work directly alongside our chief risk officer to analyze credit default vectors, train algorithmic risk scoring models, and build real-time monitoring charts.', 'INTERNSHIP', 'Remote / Work From Home', '₹45,000 - ₹60,000 / month', 8.50, 0, 2026, 'B.Tech,M.Tech', 'Computer Science & Engineering,Information Technology', 'Python,SQL,Data Analysis,Machine Learning', '2026-12-20', TRUE),
(5, 3, 4, 'Cybersecurity Threat Intelligence Analyst', 'Analyze malware signatures, configure web application firewalls, review codebase vulnerabilities, and automate security telemetry parsing.', 'FULL_TIME', 'Hyderabad, Telangana', '₹10,00,000 - ₹13,50,000 PA', 7.00, 1, 2026, 'B.Tech,M.Tech,MCA', 'All Departments', 'Networking,Python,Linux,Cybersecurity', '2026-12-10', TRUE),
(6, 3, 4, 'Frontend UI/UX Systems Specialist', 'Craft high-performance, accessible, and responsive user interfaces. You will maintain our custom component design system and ensure sub-second page loads across devices.', 'FULL_TIME', 'Hyderabad, Telangana', '₹9,00,000 - ₹12,00,000 PA', 6.50, 1, 2026, 'B.Tech,MCA,B.Sc', 'All Departments', 'React,Tailwind CSS,JavaScript,HTML5', '2026-12-25', TRUE);

-- 7. Insert Applications
INSERT INTO applications (id, job_id, student_id, status, cover_letter, applied_at) VALUES
(1, 1, 5, 'SHORTLISTED', 'I have built multiple production-grade web applications using React and Node.js. Excited for NexusCloud!', '2026-11-01 10:15:00'),
(2, 3, 5, 'UNDER_REVIEW', 'Strong foundation in SQL transactions, relational database indexing, and secure Express middleware.', '2026-11-02 14:30:00'),
(3, 6, 6, 'APPLIED', 'Passionate about frontend component architectures, Tailwind CSS design systems, and fast client-side rendering.', '2026-11-03 09:00:00'),
(4, 2, 7, 'SELECTED', 'Demonstrated expertise in Docker, cloud microservices, and database tuning with 9.20 CGPA.', '2026-10-28 11:00:00'),
(5, 4, 7, 'SHORTLISTED', 'Excited about quantitative financial modeling and distributed data analytics.', '2026-11-04 16:20:00');

-- 8. Insert Interviews
INSERT INTO interviews (id, application_id, scheduled_at, mode, meeting_link, notes, status) VALUES
(1, 1, '2026-11-15 14:00:00', 'ONLINE', 'https://meet.google.com/nex-uscl-oud', 'Technical Round 1: DSA, System Design fundamentals, and React architecture challenge.', 'SCHEDULED'),
(2, 4, '2026-11-05 11:00:00', 'ONLINE', 'https://meet.google.com/nex-dev-ops1', 'Final Leadership & SRE Director Round completed. Candidate recommended for offer.', 'COMPLETED');

-- 9. Insert Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES
(1, 5, 'Application Shortlisted!', 'Congratulations! NexusCloud Technologies shortlisted your application for Associate Full Stack Software Engineer.', 'APPLICATION_STATUS', FALSE),
(2, 5, 'Interview Scheduled', 'Your Technical Round 1 interview with NexusCloud Technologies has been scheduled for Nov 15, 2026 at 2:00 PM.', 'INTERVIEW', FALSE),
(3, 6, 'Application Submitted', 'Your application for Frontend UI/UX Systems Specialist at CyberNova Solutions has been received.', 'APPLICATION_STATUS', TRUE),
(4, 7, 'Offer Extended! 🎉', 'NexusCloud Technologies has selected you for the Cloud DevOps & Site Reliability Engineer position!', 'APPLICATION_STATUS', FALSE),
(5, 2, 'New Applicant', 'Rohit Verma applied for Associate Full Stack Software Engineer.', 'SYSTEM', TRUE),
(6, 4, 'New Applicant', 'Ananya Sen applied for Frontend UI/UX Systems Specialist.', 'SYSTEM', FALSE);
