-- Supabase Seed Data
-- This file creates test data for development and testing purposes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test tenant
INSERT INTO public.tenants (id, name, plan_tier, created_at, updated_at)
VALUES 
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Test Company Inc', 'pro', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Auth Users Information
-- The setup-local-test-data.sh script will create the following auth users:
-- Email: admin@testcompany.com, Password: TestPassword123! (Admin role)
-- Email: user@testcompany.com, Password: TestPassword123! (User role)
-- Email: john.smith@example.com, Password: TestPassword123! (User role - matches candidate)
-- Email: sarah.johnson@example.com, Password: TestPassword123! (User role - matches candidate)
-- Email: michael.chen@example.com, Password: TestPassword123! (User role - matches candidate)

-- Note: The public.users entries are created by the setup script after auth users are created
-- The script will automatically link auth users to the correct tenant (Test Company Inc)

-- Create test companies
INSERT INTO public.companies (id, tenant_id, name, culture, story, values_data, benefits_data, created_at, updated_at)
VALUES 
  (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'TechCorp Solutions',
    'We foster a culture of innovation, collaboration, and continuous learning. Our team members are encouraged to take ownership, experiment with new ideas, and grow both personally and professionally.',
    'Founded in 2015, TechCorp Solutions started as a small startup with a big vision: to revolutionize how businesses leverage AI and machine learning. Today, we''re a leading provider of AI-powered solutions serving Fortune 500 companies worldwide.',
    '{
      "description": "Innovation, Integrity, Impact, Inclusion",
      "items": ["Innovation", "Integrity", "Impact", "Inclusion", "Continuous Learning"]
    }'::jsonb,
    '{
      "description": "Comprehensive health insurance, 401k matching, flexible work arrangements, unlimited PTO, professional development budget",
      "items": ["Health Insurance", "401k Matching", "Remote Work", "Unlimited PTO", "Learning Budget", "Stock Options"]
    }'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'InnovateTech Labs',
    'At InnovateTech Labs, we believe in pushing boundaries and creating the future. Our diverse team thrives in an environment that values creativity, autonomy, and continuous experimentation.',
    'Started in 2018 as a small R&D lab, InnovateTech Labs has grown into a cutting-edge technology company specializing in emerging technologies like blockchain, IoT, and quantum computing. We partner with startups and enterprises to bring revolutionary ideas to life.',
    '{
      "description": "Curiosity, Collaboration, Courage, Customer-First",
      "items": ["Curiosity", "Collaboration", "Courage", "Customer-First", "Radical Transparency"]
    }'::jsonb,
    '{
      "description": "Full medical coverage, equity participation, flexible hours, remote-first culture, annual tech budget",
      "items": ["Medical & Dental", "Equity Options", "Fully Remote", "Flexible Hours", "$5000 Tech Budget", "Conference Allowance"]
    }'::jsonb,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create test competencies
INSERT INTO public.competencies (id, tenant_id, name, description, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Technical Skills', 'Proficiency in relevant programming languages, frameworks, and tools', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Problem Solving', 'Ability to analyze complex problems and develop effective solutions', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Communication', 'Clear and effective communication both written and verbal', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Teamwork', 'Ability to collaborate effectively with team members', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Leadership', 'Ability to lead projects and mentor team members', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create additional test positions for variety
INSERT INTO public.positions (id, tenant_id, title, description, role_overview, key_responsibilities, required_qualifications, preferred_qualifications, key_competencies_section, company_id, experience_level, department, location, employment_type, salary_range, application_deadline, reference_number, travel_requirements, work_authorization, created_at, updated_at)
VALUES 
  (
    '33333333-3333-3333-3333-333333333333',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'Frontend Engineer',
    'We are looking for a talented Frontend Engineer to create amazing user experiences.',
    'As a Frontend Engineer, you will be responsible for building responsive and performant web applications that delight our users.',
    '• Build responsive web applications using React and TypeScript
• Collaborate with designers to implement pixel-perfect UIs
• Optimize application performance and loading times
• Write unit and integration tests
• Participate in code reviews',
    '• 3+ years of frontend development experience
• Expert knowledge of React and TypeScript
• Strong CSS/SASS skills
• Experience with state management (Redux, MobX)
• Understanding of web accessibility standards',
    '• Experience with Next.js or similar frameworks
• Knowledge of design systems
• Experience with animation libraries
• Contributions to open source projects',
    'Technical skills, UI/UX sensibility, attention to detail, collaboration',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'Mid-level',
    'Engineering',
    'Remote',
    'Full-Time',
    '$100,000 - $130,000',
    NOW() + INTERVAL '30 days',
    'FE-2025-001',
    'No travel required',
    'Must be authorized to work in the US',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'DevOps Engineer',
    'Join our team to build and maintain our cloud infrastructure.',
    'We need a DevOps Engineer to help us scale our infrastructure and improve our deployment processes.',
    '• Design and maintain CI/CD pipelines
• Manage cloud infrastructure on AWS
• Implement monitoring and alerting systems
• Automate deployment processes
• Ensure system security and compliance',
    '• 4+ years of DevOps experience
• Strong knowledge of AWS services
• Experience with Docker and Kubernetes
• Proficiency in scripting (Python, Bash)
• Understanding of infrastructure as code',
    '• AWS certifications
• Experience with Terraform
• Knowledge of GitOps practices
• Experience with service mesh technologies',
    'Infrastructure expertise, automation mindset, security awareness, problem-solving',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'Senior',
    'Engineering',
    'New York, NY',
    'Full-Time',
    '$130,000 - $160,000',
    NOW() + INTERVAL '21 days',
    'DO-2025-002',
    'Occasional travel to data centers (10%)',
    'Must be authorized to work in the US',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create test positions (continuing with original ones)
INSERT INTO public.positions (id, tenant_id, title, description, role_overview, key_responsibilities, required_qualifications, preferred_qualifications, key_competencies_section, company_id, experience_level, department, location, employment_type, salary_range, application_deadline, reference_number, travel_requirements, work_authorization, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'Senior Software Engineer',
    'We are seeking an experienced Senior Software Engineer to join our growing engineering team.',
    'As a Senior Software Engineer at TechCorp Solutions, you will be responsible for designing, developing, and maintaining scalable web applications using modern technologies. You''ll work on cutting-edge AI-powered solutions that serve Fortune 500 companies worldwide.',
    '• Design and implement robust, scalable software solutions
• Mentor junior developers and conduct code reviews
• Collaborate with product managers and designers to deliver features
• Contribute to architectural decisions and technical strategy
• Ensure code quality and best practices are followed
• Participate in agile development processes
• Debug and resolve complex technical issues',
    '• 5+ years of software development experience
• Strong proficiency in JavaScript/TypeScript and React
• Experience with Node.js and RESTful APIs
• Familiarity with cloud platforms (AWS/GCP/Azure)
• Excellent problem-solving skills
• Strong understanding of software design patterns
• Experience with version control systems (Git)
• Bachelor''s degree in Computer Science or related field',
    '• Experience with WebRTC and real-time applications
• Knowledge of AI/ML integration
• Open source contributions
• Experience with microservices architecture
• Familiarity with containerization (Docker/Kubernetes)
• Experience with GraphQL
• Knowledge of CI/CD pipelines',
    'For this role, we value:
• Technical Excellence - Deep expertise in modern web technologies
• Problem Solving - Ability to tackle complex technical challenges
• Mentorship - Guide and develop junior team members
• Communication - Clear technical and non-technical communication
• Innovation - Drive technical innovation and best practices',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'Senior',
    'Engineering',
    'San Francisco, CA (Hybrid)',
    'Full-Time',
    '$150,000 - $200,000',
    NOW() + INTERVAL '45 days',
    'SSE-2025-003',
    'No travel required',
    'Must be authorized to work in the US',
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'Product Manager',
    'We are looking for a Product Manager to lead our AI interview platform product development.',
    'Join our product team as a Product Manager where you''ll drive the vision and execution of our AI-powered interview platform. You''ll work at the intersection of technology and user experience, shaping products that transform how companies conduct technical interviews.',
    '• Define product vision, strategy, and roadmap
• Gather and prioritize product requirements from stakeholders
• Work closely with engineering teams to deliver features
• Analyze user feedback and metrics to inform decisions
• Coordinate product launches and go-to-market strategies
• Conduct user research and competitive analysis
• Create detailed product specifications and user stories
• Monitor product performance and iterate based on data',
    '• 3+ years of product management experience
• Experience with B2B SaaS products
• Strong analytical and communication skills
• Technical background or ability to work closely with engineers
• Customer-focused mindset
• Experience with agile development methodologies
• Data-driven decision making skills
• Bachelor''s degree in Business, Computer Science, or related field',
    '• Experience in HR Tech or recruiting industry
• Background in AI/ML products
• MBA or advanced degree
• Experience with product analytics tools (Mixpanel, Amplitude)
• Knowledge of user research methodologies
• Experience with A/B testing and experimentation
• Public speaking or thought leadership experience',
    'Key competencies for success:
• Strategic Thinking - Develop long-term product vision
• User Empathy - Deep understanding of customer needs
• Data Analysis - Make decisions based on metrics and insights
• Communication - Articulate product vision to all stakeholders
• Leadership - Influence without authority across teams',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'Mid-level',
    'Product',
    'Remote',
    'Full-Time',
    '$120,000 - $150,000',
    NOW() + INTERVAL '25 days',
    'PM-2025-004',
    'Quarterly travel for team meetings (15%)',
    'Must be authorized to work in the US or EU',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Link positions with competencies
INSERT INTO public.position_competencies (position_id, competency_id, tenant_id, weight, created_at, updated_at)
VALUES 
  -- Senior Software Engineer competencies
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 35, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 25, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 15, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 15, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 10, NOW(), NOW()),
  -- Product Manager competencies
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 30, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 30, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 20, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 20, NOW(), NOW())
ON CONFLICT (position_id, competency_id) DO NOTHING;

-- Create positions for InnovateTech Labs
INSERT INTO public.positions (id, tenant_id, title, description, role_overview, key_responsibilities, required_qualifications, preferred_qualifications, key_competencies_section, company_id, experience_level, department, location, employment_type, salary_range, application_deadline, reference_number, travel_requirements, work_authorization, created_at, updated_at)
VALUES 
  (
    '55555555-5555-5555-5555-555555555555',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'Blockchain Developer',
    'Join our blockchain team to build decentralized applications and smart contracts.',
    'As a Blockchain Developer at InnovateTech Labs, you will design and implement blockchain solutions for our clients, working with cutting-edge technologies in the Web3 space.',
    '• Design and develop smart contracts on Ethereum and other blockchains
• Build decentralized applications (DApps) using Web3 technologies
• Implement blockchain integration solutions for enterprise clients
• Conduct security audits and optimize gas efficiency
• Research and evaluate new blockchain protocols
• Collaborate with cross-functional teams on blockchain strategy',
    '• 3+ years of blockchain development experience
• Proficiency in Solidity and smart contract development
• Experience with Web3.js, Ethers.js, or similar libraries
• Understanding of blockchain architecture and consensus mechanisms
• Strong knowledge of cryptography and security best practices
• Experience with at least one major blockchain platform
• Bachelor''s degree in Computer Science or equivalent',
    '• Experience with Layer 2 solutions (Polygon, Arbitrum, Optimism)
• Knowledge of DeFi protocols and yield farming strategies
• Contributions to blockchain open source projects
• Experience with IPFS and decentralized storage
• Understanding of MEV and blockchain economics
• Security audit experience
• Rust or Move programming language experience',
    'Technical blockchain expertise, security mindset, innovation, problem-solving, adaptability to emerging tech',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'Mid-level',
    'Engineering',
    'Remote (Global)',
    'Full-Time',
    '$120,000 - $180,000',
    NOW() + INTERVAL '35 days',
    'BC-2025-001',
    'Occasional travel for conferences (5%)',
    'Must be authorized to work remotely',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'IoT Solutions Architect',
    'Lead the design and implementation of innovative IoT solutions for our enterprise clients.',
    'We are seeking an IoT Solutions Architect to drive our Internet of Things initiatives, designing scalable and secure IoT ecosystems for various industries.',
    '• Design end-to-end IoT architectures for client projects
• Select appropriate sensors, gateways, and cloud platforms
• Implement edge computing solutions for real-time processing
• Ensure IoT security and data privacy compliance
• Create technical documentation and architecture diagrams
• Present solutions to technical and non-technical stakeholders
• Lead IoT proof-of-concepts and pilot implementations',
    '• 5+ years of experience in IoT solution development
• Strong knowledge of IoT protocols (MQTT, CoAP, LoRaWAN)
• Experience with major IoT platforms (AWS IoT, Azure IoT, Google Cloud IoT)
• Proficiency in embedded systems programming (C/C++, Python)
• Understanding of networking, security, and data analytics
• Experience with time-series databases and stream processing
• Bachelor''s degree in Engineering or Computer Science',
    '• Certifications in AWS/Azure/GCP IoT services
• Experience with industrial IoT and SCADA systems
• Knowledge of 5G and edge computing technologies
• Familiarity with digital twin concepts
• Experience with computer vision and AI at the edge
• Hardware design and prototyping skills
• Master''s degree in relevant field',
    'System design thinking, IoT expertise, security awareness, client communication, innovation',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'Senior',
    'Engineering',
    'Austin, TX (Hybrid)',
    'Full-Time',
    '$140,000 - $190,000',
    NOW() + INTERVAL '28 days',
    'IOT-2025-002',
    'Regular travel to client sites (25%)',
    'Must be authorized to work in the US',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'Quantum Computing Researcher',
    'Pioneer the future of computing with our quantum research team.',
    'Join our quantum computing division to work on groundbreaking research in quantum algorithms, error correction, and practical quantum applications.',
    '• Research and develop quantum algorithms for optimization problems
• Implement quantum circuits using Qiskit, Cirq, or similar frameworks
• Collaborate with academic partners on quantum research papers
• Explore quantum machine learning applications
• Contribute to quantum error correction research
• Present findings at conferences and publish papers
• Mentor junior researchers and interns',
    '• PhD in Physics, Computer Science, or related quantum field
• Strong mathematical background in linear algebra and quantum mechanics
• Experience with quantum computing frameworks and simulators
• Published research in quantum computing or related fields
• Programming skills in Python and quantum assembly languages
• Understanding of NISQ devices and their limitations
• Excellent research and analytical skills',
    '• Postdoctoral experience in quantum computing
• Access to quantum hardware (IBM Q, Google Sycamore, etc.)
• Experience with variational quantum algorithms
• Knowledge of quantum cryptography
• Industry collaboration experience
• Grant writing experience
• Teaching or mentoring experience',
    'Research excellence, quantum expertise, mathematical rigor, innovation, collaboration',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'Senior',
    'Research',
    'Boston, MA',
    'Full-Time',
    '$150,000 - $220,000',
    NOW() + INTERVAL '40 days',
    'QC-2025-003',
    'Conference travel (20%)',
    'Must be authorized to work in the US',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Link InnovateTech Labs positions with competencies
INSERT INTO public.position_competencies (position_id, competency_id, tenant_id, weight, created_at, updated_at)
VALUES 
  -- Blockchain Developer competencies
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 40, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 30, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 15, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 15, NOW(), NOW()),
  -- IoT Solutions Architect competencies
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 35, NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 25, NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 20, NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 20, NOW(), NOW()),
  -- Quantum Computing Researcher competencies
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 45, NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 35, NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 10, NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 10, NOW(), NOW())
ON CONFLICT (position_id, competency_id) DO NOTHING;

-- Create test candidates
INSERT INTO public.candidates (id, tenant_id, company_id, first_name, last_name, email, phone, skills, experience, education, resume_text, resume_analysis, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111112',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'John',
    'Smith',
    'john.smith@example.com',
    '+15551234567',
    ARRAY['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
    '{
      "positions_held": [
        {
          "title": "Software Engineer",
          "company": "Tech Startup Inc",
          "start_date": "2020-01",
          "end_date": "2023-12",
          "responsibilities": ["Developed React applications", "Built RESTful APIs", "Mentored junior developers"]
        },
        {
          "title": "Junior Developer",
          "company": "Web Agency LLC",
          "start_date": "2018-06",
          "end_date": "2019-12",
          "responsibilities": ["Created responsive websites", "Fixed bugs", "Wrote documentation"]
        }
      ]
    }'::jsonb,
    'Bachelor of Science in Computer Science',
    'Experienced software engineer with 5+ years developing web applications...',
    '{
      "skills": ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
      "experience": {
        "positions_held": [
          {
            "title": "Software Engineer",
            "company": "Tech Startup Inc",
            "start_date": "2020-01",
            "end_date": "2023-12"
          }
        ]
      },
      "education": [
        {
          "degree": "Bachelor of Science",
          "field": "Computer Science",
          "institution": "State University",
          "graduation_year": "2018"
        }
      ],
      "professional_summary": "Experienced software engineer with expertise in full-stack development",
      "areas_specialization": ["Web Development", "Cloud Architecture", "API Design"],
      "notable_achievements": ["Led migration to microservices", "Improved app performance by 40%"]
    }'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'Sarah',
    'Johnson',
    'sarah.johnson@example.com',
    '+15559876543',
    ARRAY['Product Management', 'Agile', 'Data Analysis', 'User Research', 'SQL'],
    '{
      "positions_held": [
        {
          "title": "Product Manager",
          "company": "SaaS Company",
          "start_date": "2021-03",
          "end_date": "2024-01",
          "responsibilities": ["Managed product roadmap", "Conducted user research", "Worked with engineering teams"]
        }
      ]
    }'::jsonb,
    'MBA in Business Administration',
    'Product manager with 3 years experience in B2B SaaS...',
    '{
      "skills": ["Product Management", "Agile", "Data Analysis", "User Research", "SQL"],
      "experience": {
        "positions_held": [
          {
            "title": "Product Manager",
            "company": "SaaS Company",
            "start_date": "2021-03",
            "end_date": "2024-01"
          }
        ]
      },
      "education": [
        {
          "degree": "MBA",
          "field": "Business Administration",
          "institution": "Business School",
          "graduation_year": "2020"
        }
      ],
      "professional_summary": "Results-driven product manager with B2B SaaS experience",
      "areas_specialization": ["Product Strategy", "User Experience", "Data Analytics"],
      "notable_achievements": ["Launched 3 major features", "Increased user retention by 25%"]
    }'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333334',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'Michael',
    'Chen',
    'michael.chen@example.com',
    '+15554567890',
    ARRAY['Python', 'Machine Learning', 'TensorFlow', 'React', 'Docker'],
    '{
      "positions_held": [
        {
          "title": "ML Engineer",
          "company": "AI Startup",
          "start_date": "2019-08",
          "end_date": "2023-06",
          "responsibilities": ["Developed ML models", "Built data pipelines", "Deployed models to production"]
        }
      ]
    }'::jsonb,
    'Master of Science in Computer Science',
    'Machine learning engineer with experience in NLP and computer vision...',
    '{
      "skills": ["Python", "Machine Learning", "TensorFlow", "React", "Docker"],
      "experience": {
        "positions_held": [
          {
            "title": "ML Engineer",
            "company": "AI Startup",
            "start_date": "2019-08",
            "end_date": "2023-06"
          }
        ]
      },
      "education": [
        {
          "degree": "Master of Science",
          "field": "Computer Science",
          "institution": "Tech University",
          "graduation_year": "2019"
        }
      ],
      "professional_summary": "ML engineer specializing in NLP and real-time systems",
      "areas_specialization": ["Machine Learning", "Natural Language Processing", "Computer Vision"],
      "notable_achievements": ["Published 2 research papers", "Built real-time transcription system"]
    }'::jsonb,
    NOW(),
    NOW()
  ),
  -- Candidates for InnovateTech Labs
  (
    '44444444-4444-4444-4444-444444444445',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'Emily',
    'Rodriguez',
    'emily.rodriguez@example.com',
    '+15552345678',
    ARRAY['Solidity', 'Ethereum', 'Web3.js', 'JavaScript', 'Smart Contracts', 'DeFi'],
    '{
      "positions_held": [
        {
          "title": "Smart Contract Developer",
          "company": "DeFi Protocol Inc",
          "start_date": "2021-06",
          "end_date": "2024-01",
          "responsibilities": ["Developed DeFi smart contracts", "Audited protocol security", "Integrated with multiple blockchains"]
        },
        {
          "title": "Full Stack Developer",
          "company": "Tech Solutions Ltd",
          "start_date": "2019-03",
          "end_date": "2021-05",
          "responsibilities": ["Built web applications", "Worked with React and Node.js", "Implemented payment integrations"]
        }
      ]
    }'::jsonb,
    'Bachelor of Science in Computer Engineering',
    'Blockchain developer with 3+ years experience in smart contract development and DeFi protocols...',
    '{
      "skills": ["Solidity", "Ethereum", "Web3.js", "JavaScript", "Smart Contracts", "DeFi"],
      "experience": {
        "positions_held": [
          {
            "title": "Smart Contract Developer",
            "company": "DeFi Protocol Inc",
            "start_date": "2021-06",
            "end_date": "2024-01"
          }
        ]
      },
      "education": [
        {
          "degree": "Bachelor of Science",
          "field": "Computer Engineering",
          "institution": "Tech Institute",
          "graduation_year": "2019"
        }
      ],
      "professional_summary": "Blockchain developer specializing in DeFi and smart contract security",
      "areas_specialization": ["Smart Contract Development", "DeFi Protocols", "Blockchain Security"],
      "notable_achievements": ["Developed contracts handling $10M TVL", "Found critical vulnerability in audit"]
    }'::jsonb,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    '55555555-5555-5555-5555-555555555556',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'David',
    'Park',
    'david.park@example.com',
    '+15553456789',
    ARRAY['IoT', 'Python', 'C++', 'AWS IoT', 'MQTT', 'Edge Computing', 'Machine Learning'],
    '{
      "positions_held": [
        {
          "title": "IoT Engineer",
          "company": "Smart Home Solutions",
          "start_date": "2020-01",
          "end_date": "2023-12",
          "responsibilities": ["Designed IoT device architectures", "Implemented edge computing solutions", "Built cloud IoT platforms"]
        },
        {
          "title": "Embedded Systems Developer",
          "company": "Industrial Tech Corp",
          "start_date": "2017-08",
          "end_date": "2019-12",
          "responsibilities": ["Programmed microcontrollers", "Developed sensor interfaces", "Optimized power consumption"]
        }
      ]
    }'::jsonb,
    'Master of Science in Electrical Engineering',
    'IoT engineer with expertise in edge computing and industrial IoT solutions...',
    '{
      "skills": ["IoT", "Python", "C++", "AWS IoT", "MQTT", "Edge Computing", "Machine Learning"],
      "experience": {
        "positions_held": [
          {
            "title": "IoT Engineer",
            "company": "Smart Home Solutions",
            "start_date": "2020-01",
            "end_date": "2023-12"
          }
        ]
      },
      "education": [
        {
          "degree": "Master of Science",
          "field": "Electrical Engineering",
          "institution": "Engineering University",
          "graduation_year": "2017"
        }
      ],
      "professional_summary": "IoT specialist with focus on industrial applications and edge AI",
      "areas_specialization": ["Industrial IoT", "Edge Computing", "Sensor Networks"],
      "notable_achievements": ["Reduced latency by 60% with edge processing", "Deployed 10,000+ IoT devices"]
    }'::jsonb,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    '66666666-6666-6666-6666-666666666667',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'Dr. Sophia',
    'Zhang',
    'sophia.zhang@example.com',
    '+15554567891',
    ARRAY['Quantum Computing', 'Qiskit', 'Python', 'Linear Algebra', 'Quantum Algorithms', 'Research'],
    '{
      "positions_held": [
        {
          "title": "Quantum Research Scientist",
          "company": "Quantum Lab University",
          "start_date": "2021-09",
          "end_date": "2024-01",
          "responsibilities": ["Developed quantum algorithms", "Published research papers", "Collaborated with IBM Quantum"]
        },
        {
          "title": "Postdoctoral Researcher",
          "company": "MIT Quantum Computing Lab",
          "start_date": "2019-07",
          "end_date": "2021-08",
          "responsibilities": ["Researched quantum error correction", "Taught quantum computing courses", "Led research team"]
        }
      ]
    }'::jsonb,
    'PhD in Quantum Physics',
    'Quantum computing researcher with expertise in quantum algorithms and error correction...',
    '{
      "skills": ["Quantum Computing", "Qiskit", "Python", "Linear Algebra", "Quantum Algorithms", "Research"],
      "experience": {
        "positions_held": [
          {
            "title": "Quantum Research Scientist",
            "company": "Quantum Lab University",
            "start_date": "2021-09",
            "end_date": "2024-01"
          }
        ]
      },
      "education": [
        {
          "degree": "PhD",
          "field": "Quantum Physics",
          "institution": "Stanford University",
          "graduation_year": "2019"
        }
      ],
      "professional_summary": "Quantum researcher with focus on NISQ algorithms and quantum machine learning",
      "areas_specialization": ["Quantum Algorithms", "Quantum Error Correction", "Quantum ML"],
      "notable_achievements": ["Published 8 peer-reviewed papers", "Developed novel VQE optimization"]
    }'::jsonb,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create test interview sessions with varied dates for dashboard metrics
INSERT INTO public.interview_sessions (id, tenant_id, position_id, candidate_id, start_time, end_time, status, created_at, updated_at)
VALUES 
  -- Upcoming interviews (next 7 days)
  (
    '11111111-1111-1111-1111-111111111115',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111112',
    NOW() + INTERVAL '2 days' + TIME '10:00:00',
    NULL,
    'scheduled',
    NOW(),
    NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111116',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222223',
    NOW() + INTERVAL '3 days' + TIME '14:30:00',
    NULL,
    'scheduled',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '11111111-1111-1111-1111-111111111117',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333334',
    NOW() + INTERVAL '5 days' + TIME '09:00:00',
    NULL,
    'scheduled',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  -- Recently completed interviews
  (
    '22222222-2222-2222-2222-222222222226',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222223',
    NOW() - INTERVAL '1 day' + TIME '14:00:00',
    NOW() - INTERVAL '1 day' + TIME '14:45:00',
    'completed',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222227',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111112',
    NOW() - INTERVAL '2 days' + TIME '10:00:00',
    NOW() - INTERVAL '2 days' + TIME '10:32:00',
    'completed',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    '22222222-2222-2222-2222-222222222228',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333334',
    NOW() - INTERVAL '3 days' + TIME '15:00:00',
    NOW() - INTERVAL '3 days' + TIME '15:28:00',
    'completed',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '3 days'
  ),
  -- Historical data for trends (past months)
  (
    '33333333-3333-3333-3333-333333333331',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111112',
    NOW() - INTERVAL '30 days' + TIME '10:00:00',
    NOW() - INTERVAL '30 days' + TIME '10:35:00',
    'completed',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222223',
    NOW() - INTERVAL '45 days' + TIME '14:00:00',
    NOW() - INTERVAL '45 days' + TIME '14:40:00',
    'completed',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '45 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333334',
    NOW() - INTERVAL '60 days' + TIME '11:00:00',
    NOW() - INTERVAL '60 days' + TIME '11:30:00',
    'completed',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  ),
  (
    '33333333-3333-3333-3333-333333333334',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111112',
    NOW() - INTERVAL '75 days' + TIME '09:00:00',
    NOW() - INTERVAL '75 days' + TIME '09:45:00',
    'completed',
    NOW() - INTERVAL '75 days',
    NOW() - INTERVAL '75 days'
  ),
  (
    '33333333-3333-3333-3333-333333333335',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    NOW() - INTERVAL '90 days' + TIME '16:00:00',
    NOW() - INTERVAL '90 days' + TIME '16:25:00',
    'completed',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days'
  ),
  -- Some cancelled interviews
  (
    '44444444-4444-4444-4444-444444444441',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333334',
    NOW() - INTERVAL '7 days' + TIME '13:00:00',
    NULL,
    'cancelled',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '7 days'
  ),
  -- In progress interview
  (
    '55555555-5555-5555-5555-555555555551',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111112',
    NOW() - TIME '00:30:00',
    NULL,
    'in_progress',
    NOW() - INTERVAL '1 hour',
    NOW()
  ),
  -- Additional interviews for Frontend Engineer position
  (
    '66666666-6666-6666-6666-666666666661',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111112',
    NOW() - INTERVAL '10 days' + TIME '10:00:00',
    NOW() - INTERVAL '10 days' + TIME '10:45:00',
    'completed',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222223',
    NOW() - INTERVAL '20 days' + TIME '14:00:00',
    NOW() - INTERVAL '20 days' + TIME '14:30:00',
    'completed',
    NOW() - INTERVAL '22 days',
    NOW() - INTERVAL '20 days'
  ),
  (
    '66666666-6666-6666-6666-666666666663',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333334',
    NOW() - INTERVAL '35 days' + TIME '11:00:00',
    NOW() - INTERVAL '35 days' + TIME '11:40:00',
    'completed',
    NOW() - INTERVAL '37 days',
    NOW() - INTERVAL '35 days'
  ),
  -- Additional interviews for DevOps Engineer position
  (
    '77777777-7777-7777-7777-777777777771',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333334',
    NOW() - INTERVAL '15 days' + TIME '09:00:00',
    NOW() - INTERVAL '15 days' + TIME '09:50:00',
    'completed',
    NOW() - INTERVAL '17 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111112',
    NOW() + INTERVAL '4 days' + TIME '15:00:00',
    NULL,
    'scheduled',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  -- Interview sessions for InnovateTech Labs
  (
    '88888888-8888-8888-8888-888888888881',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '55555555-5555-5555-5555-555555555555', -- Blockchain Developer position
    '44444444-4444-4444-4444-444444444445', -- Emily Rodriguez
    NOW() + INTERVAL '6 days' + TIME '11:00:00',
    NULL,
    'scheduled',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '88888888-8888-8888-8888-888888888882',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '66666666-6666-6666-6666-666666666666', -- IoT Solutions Architect position
    '55555555-5555-5555-5555-555555555556', -- David Park
    NOW() - INTERVAL '5 days' + TIME '14:00:00',
    NOW() - INTERVAL '5 days' + TIME '14:45:00',
    'completed',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '5 days'
  ),
  (
    '88888888-8888-8888-8888-888888888883',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '77777777-7777-7777-7777-777777777777', -- Quantum Computing Researcher position
    '66666666-6666-6666-6666-666666666667', -- Dr. Sophia Zhang
    NOW() - INTERVAL '10 days' + TIME '10:00:00',
    NOW() - INTERVAL '10 days' + TIME '10:50:00',
    'completed',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    '88888888-8888-8888-8888-888888888884',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '55555555-5555-5555-5555-555555555555', -- Blockchain Developer position
    '11111111-1111-1111-1111-111111111112', -- John Smith (cross-company interview)
    NOW() + INTERVAL '8 days' + TIME '09:00:00',
    NULL,
    'scheduled',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    '88888888-8888-8888-8888-888888888885',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '66666666-6666-6666-6666-666666666666', -- IoT Solutions Architect position
    '55555555-5555-5555-5555-555555555556', -- David Park
    NOW() + INTERVAL '3 days' + TIME '16:00:00',
    NULL,
    'scheduled',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create test interview invitations
INSERT INTO public.interview_invitations (token, tenant_id, session_id, candidate_id, expires_at, status, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111117',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111115',
    '11111111-1111-1111-1111-111111111112',
    NOW() + INTERVAL '7 days',
    'pending',
    NOW(),
    NOW()
  )
ON CONFLICT (token) DO NOTHING;

-- Add transcript entries for completed interviews
INSERT INTO public.transcript_entries (id, tenant_id, session_id, speaker, text, start_ms, confidence, created_at)
VALUES 
  -- Interview session 22222222-2222-2222-2222-222222222226 (Sarah Johnson - Product Manager)
  (
    '11111111-1111-1111-1111-111111111118',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222226',
    'interviewer',
    'Hello Sarah, thank you for joining us today. Can you tell me about your experience as a Product Manager?',
    0,
    0.95,
    NOW() - INTERVAL '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222229',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222226',
    'candidate',
    'Thank you for having me. I have been working as a Product Manager for the past 3 years at a B2B SaaS company where I led the development of our core analytics platform.',
    15000,
    0.92,
    NOW() - INTERVAL '1 day' + INTERVAL '15 seconds'
  ),
  (
    '33333333-3333-3333-3333-333333333339',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222226',
    'interviewer',
    'That sounds interesting. What were some of the key challenges you faced in that role?',
    45000,
    0.94,
    NOW() - INTERVAL '1 day' + INTERVAL '45 seconds'
  ),
  -- Interview session 22222222-2222-2222-2222-222222222227 (John Smith - Senior Software Engineer)
  (
    '44444444-4444-4444-4444-444444444448',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222227',
    'interviewer',
    'Good morning John. Let us start with your experience in full-stack development.',
    0,
    0.96,
    NOW() - INTERVAL '2 days'
  ),
  (
    '55555555-5555-5555-5555-555555555559',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222227',
    'candidate',
    'I have been developing web applications for over 5 years, primarily using React for frontend and Node.js for backend services.',
    12000,
    0.93,
    NOW() - INTERVAL '2 days' + INTERVAL '12 seconds'
  ),
  -- Interview session 22222222-2222-2222-2222-222222222228 (Michael Chen - Senior Software Engineer)
  (
    '66666666-6666-6666-6666-666666666660',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222228',
    'interviewer',
    'Michael, I see you have experience with machine learning. Can you tell us about a project where you applied ML?',
    0,
    0.97,
    NOW() - INTERVAL '3 days'
  ),
  (
    '77777777-7777-7777-7777-777777777771',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222228',
    'candidate',
    'Certainly. At my previous company, I built a real-time transcription system using deep learning models for speech recognition.',
    18000,
    0.91,
    NOW() - INTERVAL '3 days' + INTERVAL '18 seconds'
  ),
  -- Transcript entries for InnovateTech Labs interviews
  -- Interview session 88888888-8888-8888-8888-888888888882 (David Park - IoT Solutions Architect)
  (
    '88888888-8888-8888-8888-888888888881',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '88888888-8888-8888-8888-888888888882',
    'interviewer',
    'David, welcome. Can you describe your experience with IoT architectures and edge computing?',
    0,
    0.95,
    NOW() - INTERVAL '5 days'
  ),
  (
    '88888888-8888-8888-8888-888888888882',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '88888888-8888-8888-8888-888888888882',
    'candidate',
    'Thank you for having me. I have been working with IoT systems for over 6 years, focusing on edge computing solutions that process data locally to reduce latency and bandwidth usage.',
    15000,
    0.93,
    NOW() - INTERVAL '5 days' + INTERVAL '15 seconds'
  ),
  (
    '88888888-8888-8888-8888-888888888883',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '88888888-8888-8888-8888-888888888882',
    'interviewer',
    'That is impressive. What protocols have you worked with for IoT communication?',
    35000,
    0.94,
    NOW() - INTERVAL '5 days' + INTERVAL '35 seconds'
  ),
  (
    '88888888-8888-8888-8888-888888888884',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '88888888-8888-8888-8888-888888888882',
    'candidate',
    'I have extensive experience with MQTT for lightweight messaging, CoAP for constrained devices, and LoRaWAN for long-range, low-power applications. I have also implemented custom protocols for specific industrial use cases.',
    50000,
    0.92,
    NOW() - INTERVAL '5 days' + INTERVAL '50 seconds'
  ),
  -- Interview session 88888888-8888-8888-8888-888888888883 (Dr. Sophia Zhang - Quantum Computing Researcher)
  (
    '99999999-9999-9999-9999-999999999991',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '88888888-8888-8888-8888-888888888883',
    'interviewer',
    'Dr. Zhang, your research in quantum algorithms is quite impressive. Can you tell us about your work with NISQ devices?',
    0,
    0.96,
    NOW() - INTERVAL '10 days'
  ),
  (
    '99999999-9999-9999-9999-999999999992',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '88888888-8888-8888-8888-888888888883',
    'candidate',
    'Thank you. My research focuses on developing algorithms that can run effectively on Noisy Intermediate-Scale Quantum devices. I have been working on variational quantum eigensolver improvements that reduce circuit depth while maintaining accuracy.',
    20000,
    0.94,
    NOW() - INTERVAL '10 days' + INTERVAL '20 seconds'
  ),
  (
    '99999999-9999-9999-9999-999999999993',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '88888888-8888-8888-8888-888888888883',
    'interviewer',
    'How do you see quantum computing evolving in the next 5 years?',
    45000,
    0.95,
    NOW() - INTERVAL '10 days' + INTERVAL '45 seconds'
  ),
  (
    '99999999-9999-9999-9999-999999999994',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '88888888-8888-8888-8888-888888888883',
    'candidate',
    'I believe we will see significant improvements in error rates and coherence times. More importantly, we will identify specific problem domains where quantum advantage is achievable with current technology, particularly in optimization and chemistry simulations.',
    65000,
    0.93,
    NOW() - INTERVAL '10 days' + INTERVAL '65 seconds'
  )
ON CONFLICT (id) DO NOTHING;

-- Output helpful information
DO $$
BEGIN
  RAISE NOTICE 'Seed data created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Test Tenant ID: d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0';
  RAISE NOTICE 'Test Company: Test Company Inc';
  RAISE NOTICE '';
  RAISE NOTICE 'NOTE: Auth users are created by the setup-local-test-data.sh script';
  RAISE NOTICE 'The following test accounts will be available:';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin/General Users:';
  RAISE NOTICE '  - admin@testcompany.com (Admin role)';
  RAISE NOTICE '  - user@testcompany.com (User role)';
  RAISE NOTICE '';
  RAISE NOTICE 'TechCorp Solutions Candidates:';
  RAISE NOTICE '  - john.smith@example.com (User role - matches candidate John Smith)';
  RAISE NOTICE '  - sarah.johnson@example.com (User role - matches candidate Sarah Johnson)';
  RAISE NOTICE '  - michael.chen@example.com (User role - matches candidate Michael Chen)';
  RAISE NOTICE '';
  RAISE NOTICE 'InnovateTech Labs Candidates:';
  RAISE NOTICE '  - emily.rodriguez@example.com (User role - matches candidate Emily Rodriguez)';
  RAISE NOTICE '  - david.park@example.com (User role - matches candidate David Park)';
  RAISE NOTICE '  - sophia.zhang@example.com (User role - matches candidate Dr. Sophia Zhang)';
  RAISE NOTICE '';
  RAISE NOTICE 'All accounts use password: TestPassword123!';
END $$;

-- NOTE: This section is commented out to avoid duplication issues
-- The above interview sessions are sufficient for testing purposes

-- NOTE: Interview invitations removed - they reference invalid session and candidate IDs

-- NOTE: Additional transcript entries removed - they reference invalid session IDs and use wrong column names