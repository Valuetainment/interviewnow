-- Supabase Seed Data
-- This file creates test data for development and testing purposes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test tenant
INSERT INTO public.tenants (id, name, plan_tier, tenancy_type, created_at, updated_at)
VALUES 
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Test Company Inc', 'pro', 'enterprise', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Auth Users Information
-- The setup-local-test-data.sh script will create the following auth users:
-- SYSTEM ADMIN:
-- Email: system.admin@interviewnow.ai, Password: TestPassword123! (System Admin role)
--
-- TENANT ADMINS (one for each company):
-- Email: admin@techcorp.com, Password: TestPassword123! (Tenant Admin for TechCorp Solutions)
-- Email: admin@innovatetech.com, Password: TestPassword123! (Tenant Admin for InnovateTech Labs)
--
-- TENANT INTERVIEWERS (one for each company):
-- Email: interviewer@techcorp.com, Password: TestPassword123! (Tenant Interviewer for TechCorp Solutions)
-- Email: interviewer@innovatetech.com, Password: TestPassword123! (Tenant Interviewer for InnovateTech Labs)
--
-- TENANT CANDIDATES (no login capability):
-- These are created as candidates only, without auth.users entries

-- Note: The public.users entries are created by the setup script after auth users are created

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

-- Create positions for both companies
INSERT INTO public.positions (id, tenant_id, company_id, title, description, role_overview, key_responsibilities, required_qualifications, preferred_qualifications, key_competencies_section, experience_level, department, location, employment_type, salary_range, travel_requirements, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'Senior Frontend Engineer',
    'We are seeking a talented Senior Frontend Engineer to join our growing team and help build the next generation of AI-powered applications.',
    'As a Senior Frontend Engineer at TechCorp Solutions, you will play a key role in designing and implementing user interfaces for our cutting-edge AI products. You will work closely with product managers, designers, and backend engineers to create exceptional user experiences.',
    'Design and implement responsive, performant web applications using React and TypeScript\nCollaborate with UX/UI designers to translate designs into pixel-perfect implementations\nOptimize applications for maximum speed and scalability\nMentor junior developers and conduct code reviews\nContribute to architectural decisions and technical roadmap planning\nWork with backend engineers to integrate APIs and ensure smooth data flow',
    'Bachelor''s degree in Computer Science or related field\n5+ years of professional frontend development experience\nExpert knowledge of React, TypeScript, and modern JavaScript\nStrong understanding of HTML5, CSS3, and responsive design principles\nExperience with state management libraries (Redux, MobX, or similar)\nProficiency with modern build tools and CI/CD pipelines\nExcellent problem-solving and communication skills',
    'Experience with GraphQL and Apollo Client\nFamiliarity with server-side rendering (Next.js)\nKnowledge of web accessibility standards (WCAG)\nExperience with testing frameworks (Jest, React Testing Library)\nContributions to open-source projects\nExperience with design systems and component libraries',
    'Technical Excellence\nProblem Solving\nCollaboration\nInnovation\nLeadership',
    'Senior',
    'Engineering',
    'San Francisco, CA (Hybrid)',
    'Full-Time',
    '$150,000 - $200,000',
    '10% travel to other offices',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'Machine Learning Engineer',
    'Join our AI team to develop and deploy machine learning models that power intelligent features across our product suite.',
    'As a Machine Learning Engineer, you will be responsible for designing, implementing, and deploying ML models at scale. You will work on challenging problems in natural language processing, computer vision, and predictive analytics.',
    'Design and implement machine learning pipelines for production systems\nDevelop and optimize ML models for various use cases\nCollaborate with data scientists to transform prototypes into production-ready solutions\nImplement monitoring and evaluation systems for deployed models\nWork with engineering teams to integrate ML capabilities into products\nStay current with latest ML research and technologies',
    'Master''s degree in Computer Science, Machine Learning, or related field\n3+ years of experience in machine learning engineering\nStrong programming skills in Python and experience with ML frameworks (TensorFlow, PyTorch)\nExperience with cloud platforms (AWS, GCP, or Azure)\nKnowledge of MLOps practices and tools\nStrong mathematical and statistical background',
    'PhD in relevant field\nPublications in top ML conferences\nExperience with large language models\nKnowledge of distributed computing frameworks\nExperience with real-time ML systems\nContributions to ML open-source projects',
    'Technical Expertise\nAnalytical Thinking\nInnovation\nCollaboration\nContinuous Learning',
    'Mid-Senior',
    'AI/ML',
    'San Francisco, CA (Hybrid)',
    'Full-Time',
    '$160,000 - $220,000',
    'Minimal travel required',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'Blockchain Developer',
    'InnovateTech Labs is looking for a passionate Blockchain Developer to help build decentralized applications and smart contracts.',
    'As a Blockchain Developer, you will design and implement blockchain-based solutions for various industry applications. You will work on cutting-edge projects involving DeFi, NFTs, and enterprise blockchain solutions.',
    'Develop smart contracts using Solidity and other blockchain languages\nDesign and implement decentralized applications (DApps)\nIntegrate blockchain solutions with existing systems\nConduct security audits and optimize gas efficiency\nResearch and evaluate new blockchain technologies\nCollaborate with cross-functional teams on blockchain initiatives',
    'Bachelor''s degree in Computer Science or related field\n2+ years of blockchain development experience\nProficiency in Solidity and Web3.js\nExperience with Ethereum and other blockchain platforms\nStrong understanding of cryptography and distributed systems\nExperience with smart contract testing and deployment',
    'Experience with Layer 2 solutions\nKnowledge of multiple blockchain platforms (Polygon, Binance Smart Chain, etc.)\nFamiliarity with DeFi protocols\nExperience with IPFS and decentralized storage\nContributions to blockchain open-source projects\nCertifications in blockchain technology',
    'Technical Innovation\nProblem Solving\nSecurity Mindset\nCollaboration\nAdaptability',
    'Mid-Level',
    'Engineering',
    'Remote',
    'Full-Time',
    '$140,000 - $190,000',
    'No travel required',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'IoT Solutions Architect',
    'Lead the design and implementation of innovative IoT solutions for our enterprise clients.',
    'As an IoT Solutions Architect, you will be responsible for designing end-to-end IoT solutions that connect devices, collect data, and provide actionable insights. You will work with clients to understand their needs and translate them into technical architectures.',
    'Design scalable IoT architectures for various use cases\nLead technical discussions with clients and stakeholders\nDevelop proof of concepts and technical demonstrations\nCreate technical documentation and architecture diagrams\nEvaluate and select appropriate IoT platforms and technologies\nMentor development teams on IoT best practices',
    'Bachelor''s degree in Engineering or Computer Science\n5+ years of experience in IoT solution development\nExperience with IoT platforms (AWS IoT, Azure IoT, Google Cloud IoT)\nKnowledge of IoT protocols (MQTT, CoAP, LoRaWAN)\nStrong understanding of edge computing and data analytics\nExcellent communication and presentation skills',
    'Professional certifications in cloud platforms\nExperience with industrial IoT applications\nKnowledge of AI/ML for IoT data analysis\nFamiliarity with IoT security best practices\nExperience with digital twin technologies\nPublic speaking experience at tech conferences',
    'Strategic Thinking\nTechnical Leadership\nClient Focus\nInnovation\nCommunication',
    'Senior',
    'Solutions Architecture',
    'New York, NY (Hybrid)',
    'Full-Time',
    '$170,000 - $230,000',
    '25% travel to client sites',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create competencies
INSERT INTO public.competencies (id, tenant_id, name, description, created_at, updated_at)
VALUES
  ('c0c0c0c1-c0c0-c0c0-c0c0-c0c0c0c0c0c1', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Technical Excellence', 'Demonstrates deep technical knowledge and applies it effectively', NOW(), NOW()),
  ('c0c0c0c2-c0c0-c0c0-c0c0-c0c0c0c0c0c2', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Problem Solving', 'Analyzes complex problems and develops effective solutions', NOW(), NOW()),
  ('c0c0c0c3-c0c0-c0c0-c0c0-c0c0c0c0c0c3', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Collaboration', 'Works effectively with team members and stakeholders', NOW(), NOW()),
  ('c0c0c0c4-c0c0-c0c0-c0c0-c0c0c0c0c0c4', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Innovation', 'Brings creative ideas and drives innovation', NOW(), NOW()),
  ('c0c0c0c5-c0c0-c0c0-c0c0-c0c0c0c0c0c5', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Leadership', 'Guides and inspires others to achieve goals', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Link competencies to positions
INSERT INTO public.position_competencies (position_id, competency_id, tenant_id, weight, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'c0c0c0c1-c0c0-c0c0-c0c0-c0c0c0c0c0c1', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 5, NOW()),
  ('11111111-1111-1111-1111-111111111111', 'c0c0c0c2-c0c0-c0c0-c0c0-c0c0c0c0c0c2', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 4, NOW()),
  ('11111111-1111-1111-1111-111111111111', 'c0c0c0c3-c0c0-c0c0-c0c0-c0c0c0c0c0c3', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 4, NOW()),
  ('11111111-1111-1111-1111-111111111111', 'c0c0c0c4-c0c0-c0c0-c0c0-c0c0c0c0c0c4', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 3, NOW()),
  ('11111111-1111-1111-1111-111111111111', 'c0c0c0c5-c0c0-c0c0-c0c0-c0c0c0c0c0c5', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 3, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'c0c0c0c1-c0c0-c0c0-c0c0-c0c0c0c0c0c1', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 5, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'c0c0c0c2-c0c0-c0c0-c0c0-c0c0c0c0c0c2', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 5, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'c0c0c0c4-c0c0-c0c0-c0c0-c0c0c0c0c0c4', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 4, NOW())
ON CONFLICT (position_id, competency_id) DO NOTHING;

-- Create candidates (without auth.users entries)
INSERT INTO public.candidates (id, tenant_id, company_id, email, first_name, last_name, phone, skills, experience, education, created_at, updated_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111121',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'john.smith@example.com',
    'John',
    'Smith',
    '+1234567890',
    ARRAY['React', 'TypeScript', 'Node.js', 'AWS', 'GraphQL'],
    '{"years": 6, "companies": ["Meta", "Google"], "roles": ["Senior Frontend Engineer", "Frontend Developer"]}'::jsonb,
    '{"degree": "BS Computer Science", "school": "Stanford University", "year": 2018}'::jsonb,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
  ),
  (
    '22222222-2222-2222-2222-222222222232',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'sarah.johnson@example.com',
    'Sarah',
    'Johnson',
    '+1234567891',
    ARRAY['Python', 'TensorFlow', 'PyTorch', 'Kubernetes', 'MLOps'],
    '{"years": 4, "companies": ["OpenAI", "DeepMind"], "roles": ["ML Engineer", "Data Scientist"]}'::jsonb,
    '{"degree": "MS Machine Learning", "school": "Carnegie Mellon", "year": 2020}'::jsonb,
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '18 days'
  ),
  (
    '33333333-3333-3333-3333-333333333343',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'michael.chen@example.com',
    'Michael',
    'Chen',
    '+1234567892',
    ARRAY['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts', 'DeFi'],
    '{"years": 3, "companies": ["Coinbase", "Consensys"], "roles": ["Blockchain Developer", "Smart Contract Engineer"]}'::jsonb,
    '{"degree": "BS Computer Engineering", "school": "UC Berkeley", "year": 2021}'::jsonb,
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days'
  ),
  (
    '44444444-4444-4444-4444-444444444454',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'emily.rodriguez@example.com',
    'Emily',
    'Rodriguez',
    '+1234567893',
    ARRAY['IoT', 'AWS IoT', 'Python', 'MQTT', 'Edge Computing'],
    '{"years": 7, "companies": ["GE Digital", "Siemens"], "roles": ["IoT Architect", "Senior IoT Engineer"]}'::jsonb,
    '{"degree": "MS Electrical Engineering", "school": "MIT", "year": 2017}'::jsonb,
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days'
  ),
  (
    '55555555-5555-5555-5555-555555555565',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'david.park@example.com',
    'David',
    'Park',
    '+1234567894',
    ARRAY['Vue.js', 'JavaScript', 'CSS', 'Webpack', 'Jest'],
    '{"years": 5, "companies": ["Netflix", "Airbnb"], "roles": ["Frontend Engineer", "UI Developer"]}'::jsonb,
    '{"degree": "BS Information Systems", "school": "University of Washington", "year": 2019}'::jsonb,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    '66666666-6666-6666-6666-666666666676',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'sophia.zhang@example.com',
    'Sophia',
    'Zhang',
    '+1234567895',
    ARRAY['Rust', 'Substrate', 'Polkadot', 'Blockchain', 'Cryptography'],
    '{"years": 2, "companies": ["Parity Technologies"], "roles": ["Blockchain Engineer"]}'::jsonb,
    '{"degree": "BS Mathematics", "school": "Caltech", "year": 2022}'::jsonb,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create interview sessions
INSERT INTO public.interview_sessions (id, tenant_id, candidate_id, position_id, company_id, start_time, end_time, status, created_at, updated_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111131',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111121',
    '11111111-1111-1111-1111-111111111111',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days' + INTERVAL '45 minutes',
    'completed',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    '22222222-2222-2222-2222-222222222242',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222232',
    '22222222-2222-2222-2222-222222222222',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days' + INTERVAL '1 hour',
    'completed',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '5 days'
  ),
  (
    '33333333-3333-3333-3333-333333333353',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '33333333-3333-3333-3333-333333333343',
    '33333333-3333-3333-3333-333333333333',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '30 minutes',
    'completed',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    '44444444-4444-4444-4444-444444444464',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '44444444-4444-4444-4444-444444444454',
    '44444444-4444-4444-4444-444444444444',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    NOW() + INTERVAL '2 days',
    NULL,
    'scheduled',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    '55555555-5555-5555-5555-555555555575',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '55555555-5555-5555-5555-555555555565',
    '11111111-1111-1111-1111-111111111111',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    NOW() + INTERVAL '5 days',
    NULL,
    'scheduled',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '66666666-6666-6666-6666-666666666686',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '66666666-6666-6666-6666-666666666676',
    '33333333-3333-3333-3333-333333333333',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '45 minutes',
    'completed',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- Create transcript entries for completed sessions
INSERT INTO public.transcript_entries (id, session_id, tenant_id, start_ms, speaker, text, created_at)
VALUES
  -- Session 1 transcript entries
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f111', '11111111-1111-1111-1111-111111111131', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 0, 'interviewer', 'Hi John, thanks for joining us today. Can you tell me about your experience with React and TypeScript?', NOW() - INTERVAL '7 days'),
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f112', '11111111-1111-1111-1111-111111111131', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 15000, 'candidate', 'Sure! I have been working with React for about 6 years now, starting with class components and transitioning to hooks. I have extensive experience with TypeScript, using it in production for the last 4 years at Meta.', NOW() - INTERVAL '7 days'),
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f113', '11111111-1111-1111-1111-111111111131', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 35000, 'interviewer', 'That sounds great. Can you walk me through a challenging technical problem you solved recently?', NOW() - INTERVAL '7 days'),
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f114', '11111111-1111-1111-1111-111111111131', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 45000, 'candidate', 'At Meta, I led the optimization of our news feed rendering performance. We were experiencing significant lag with complex nested components...', NOW() - INTERVAL '7 days'),
  
  -- Session 2 transcript entries
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f221', '22222222-2222-2222-2222-222222222242', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 0, 'interviewer', 'Hi Sarah, welcome! I would love to hear about your machine learning experience, particularly with TensorFlow and PyTorch.', NOW() - INTERVAL '5 days'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f222', '22222222-2222-2222-2222-222222222242', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 20000, 'candidate', 'Thank you! I have been working in ML for 4 years. At OpenAI, I primarily used PyTorch for research projects, including work on large language models...', NOW() - INTERVAL '5 days'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f223', '22222222-2222-2222-2222-222222222242', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 50000, 'interviewer', 'Interesting! Can you explain how you approach model optimization for production deployment?', NOW() - INTERVAL '5 days'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f224', '22222222-2222-2222-2222-222222222242', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 65000, 'candidate', 'Model optimization is crucial for production. I typically start with quantization and pruning techniques...', NOW() - INTERVAL '5 days'),
  
  -- Session 3 transcript entries
  ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f331', '33333333-3333-3333-3333-333333333353', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 0, 'interviewer', 'Michael, thanks for taking the time to speak with us. Can you share your experience with smart contract development?', NOW() - INTERVAL '3 days'),
  ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f332', '33333333-3333-3333-3333-333333333353', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 18000, 'candidate', 'Absolutely! I have been developing smart contracts for 3 years, primarily on Ethereum. I have deployed over 20 contracts to mainnet...', NOW() - INTERVAL '3 days'),
  ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f333', '33333333-3333-3333-3333-333333333353', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 40000, 'interviewer', 'How do you ensure the security of your smart contracts?', NOW() - INTERVAL '3 days'),
  ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f334', '33333333-3333-3333-3333-333333333353', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 55000, 'candidate', 'Security is paramount in blockchain. I always follow best practices like using OpenZeppelin libraries, conducting thorough testing with Hardhat...', NOW() - INTERVAL '3 days'),
  
  -- Session 6 transcript entries
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f661', '66666666-6666-6666-6666-666666666686', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 0, 'interviewer', 'Hi Sophia, excited to talk with you about blockchain engineering. What attracted you to working with Rust and Substrate?', NOW() - INTERVAL '1 day'),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f662', '66666666-6666-6666-6666-666666666686', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 12000, 'candidate', 'I was drawn to Rust for its memory safety guarantees and performance. When I discovered Substrate, I was fascinated by the ability to build custom blockchains...', NOW() - INTERVAL '1 day'),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f663', '66666666-6666-6666-6666-666666666686', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 30000, 'interviewer', 'Can you explain a challenging problem you solved while working with Substrate?', NOW() - INTERVAL '1 day'),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f664', '66666666-6666-6666-6666-666666666686', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 42000, 'candidate', 'One of the most challenging problems was implementing a custom consensus mechanism. We needed to modify the GRANDPA finality gadget...', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Create interview invitations
INSERT INTO public.interview_invitations (token, tenant_id, session_id, candidate_id, expires_at, status, created_at, updated_at)
VALUES
  (
    '91919191-9191-9191-9191-919191919191',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '44444444-4444-4444-4444-444444444464',
    '44444444-4444-4444-4444-444444444454',
    NOW() + INTERVAL '7 days',
    'pending',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    '92929292-9292-9292-9292-929292929292',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '55555555-5555-5555-5555-555555555575',
    '55555555-5555-5555-5555-555555555565',
    NOW() + INTERVAL '10 days',
    'pending',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (token) DO NOTHING;

-- Create candidate assessments for completed interviews
INSERT INTO public.candidate_assessments (id, tenant_id, session_id, details, weighted_score, created_at, updated_at)
VALUES
  (
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a111',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111131',
    '{
      "competency_scores": {"Technical Excellence": 4.5, "Problem Solving": 4.2, "Collaboration": 4.0, "Innovation": 3.8, "Leadership": 3.5},
      "overall_score": 4.0,
      "strengths": ["Strong React expertise", "Excellent problem-solving skills", "Good communication"],
      "areas_for_improvement": ["Could improve system design knowledge", "Limited backend experience"],
      "recommendation": "Strong candidate for the Senior Frontend Engineer position. Recommend moving forward to final round."
    }'::jsonb,
    4.0,
    NOW() - INTERVAL '7 days' + INTERVAL '2 hours',
    NOW() - INTERVAL '7 days' + INTERVAL '2 hours'
  ),
  (
    'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a222',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222242',
    '{
      "competency_scores": {"Technical Excellence": 4.8, "Problem Solving": 4.7, "Innovation": 4.5, "Collaboration": 4.0},
      "overall_score": 4.5,
      "strengths": ["Deep ML knowledge", "Production experience", "Strong theoretical foundation"],
      "areas_for_improvement": ["Could improve communication of complex topics", "Limited experience with real-time systems"],
      "recommendation": "Excellent candidate for ML Engineer role. Strong hire recommendation."
    }'::jsonb,
    4.5,
    NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
    NOW() - INTERVAL '5 days' + INTERVAL '2 hours'
  ),
  (
    'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a333',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '33333333-3333-3333-3333-333333333353',
    '{
      "competency_scores": {"Technical Innovation": 4.3, "Problem Solving": 4.0, "Security Mindset": 4.5, "Collaboration": 3.8, "Adaptability": 4.0},
      "overall_score": 4.1,
      "strengths": ["Strong blockchain knowledge", "Security-focused mindset", "Good practical experience"],
      "areas_for_improvement": ["Limited experience with Layer 2 solutions", "Could expand knowledge beyond Ethereum"],
      "recommendation": "Good fit for Blockchain Developer position. Recommend proceeding with offer."
    }'::jsonb,
    4.1,
    NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
    NOW() - INTERVAL '3 days' + INTERVAL '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample billing information for the test tenant
INSERT INTO public.billing_information (id, tenant_id, billing_email, created_at, updated_at)
VALUES 
  (
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'billing@testcompany.com',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample invoices for the test tenant
INSERT INTO public.invoices (id, tenant_id, invoice_number, amount_due, amount_paid, status, due_date, line_items, created_at, updated_at)
VALUES 
  (
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'INV-2025-001',
    50000, -- $500.00
    50000,
    'paid',
    NOW() - INTERVAL '15 days',
    '[{"description": "Pro Plan - Monthly", "amount": 50000}]'::jsonb,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'INV-2025-002',
    50000, -- $500.00
    0,
    'open',
    NOW() + INTERVAL '15 days',
    '[{"description": "Pro Plan - Monthly", "amount": 50000}]'::jsonb,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample payment history
INSERT INTO public.payment_history (id, tenant_id, invoice_id, amount, status, payment_method, created_at)
VALUES 
  (
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    50000,
    'succeeded',
    'card',
    NOW() - INTERVAL '15 days'
  )
ON CONFLICT (id) DO NOTHING;

-- The setup script will create interviewer_company_access entries after creating the users
-- to give interviewers access to their respective companies

-- =====================================================
-- ADDITIONAL SEED DATA - More Companies, Positions, and Candidates
-- =====================================================

-- Add third company - Climate Tech
INSERT INTO public.companies (id, tenant_id, name, culture, story, values_data, benefits_data, created_at, updated_at)
VALUES 
  (
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'GreenFuture Technologies',
    'We are on a mission to combat climate change through innovative technology solutions. Our team is passionate about sustainability and believes that technology can create a better future for our planet.',
    'Founded in 2019 by former Tesla and SpaceX engineers, GreenFuture Technologies develops cutting-edge carbon capture systems and renewable energy optimization platforms. We have already helped remove 100,000 tons of CO2 from the atmosphere and optimized energy usage for over 500 companies.',
    '{
      "description": "Sustainability, Innovation, Transparency, Impact, Community",
      "items": ["Environmental Sustainability", "Technological Innovation", "Radical Transparency", "Measurable Impact", "Global Community"]
    }'::jsonb,
    '{
      "description": "Carbon-neutral workplace, green commute benefits, volunteer time off, comprehensive healthcare, equity compensation",
      "items": ["100% Healthcare Coverage", "Green Commute Stipend", "40 Hours Volunteer PTO", "Equity Package", "4-Day Work Week", "Carbon Offset for Personal Travel"]
    }'::jsonb,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Add more positions for all companies
INSERT INTO public.positions (id, tenant_id, company_id, title, description, role_overview, key_responsibilities, required_qualifications, preferred_qualifications, key_competencies_section, experience_level, department, location, employment_type, salary_range, travel_requirements, created_at, updated_at)
VALUES 
  -- TechCorp Solutions - Additional Position
  (
    '55555555-5555-5555-5555-555555555555',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'Staff Data Engineer',
    'Lead our data infrastructure team in building scalable data pipelines and analytics platforms for AI/ML workloads.',
    'As a Staff Data Engineer at TechCorp Solutions, you will architect and implement large-scale data processing systems that power our AI products. You will lead a team of data engineers and work closely with ML engineers and data scientists.',
    'Design and implement scalable data pipelines using Apache Spark and Airflow\nLead architecture decisions for our data platform\nOptimize data storage and processing for cost and performance\nBuild real-time streaming data systems\nMentor and guide a team of 5+ data engineers\nCollaborate with ML teams to support model training and inference',
    'Bachelor''s degree in Computer Science or related field\n8+ years of data engineering experience\nExpert knowledge of distributed computing (Spark, Hadoop)\nStrong experience with cloud data platforms (Snowflake, BigQuery, Redshift)\nProficiency in Python, Scala, or Java\nExperience with streaming technologies (Kafka, Flink)\nProven leadership and mentoring skills',
    'Experience with Databricks or similar platforms\nKnowledge of data mesh architecture\nExperience with dbt and modern data stack\nContributions to open-source data projects\nExperience with ML feature stores\nAdvanced degree in relevant field',
    'Technical Leadership\nData Architecture\nProblem Solving\nTeam Building\nStrategic Thinking',
    'Staff',
    'Data Engineering',
    'San Francisco, CA (Hybrid)',
    'Full-Time',
    '$200,000 - $280,000',
    '15% travel to other offices',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
  ),
  -- InnovateTech Labs - Additional Position
  (
    '77777777-7777-7777-7777-777777777777',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'Quantum Computing Engineer',
    'Join our quantum computing research team to develop algorithms and applications for near-term quantum devices.',
    'As a Quantum Computing Engineer at InnovateTech Labs, you will work on cutting-edge quantum algorithms and help bring quantum computing from research to practical applications. You will collaborate with leading researchers and have access to state-of-the-art quantum hardware.',
    'Develop quantum algorithms for optimization and machine learning\nImplement quantum circuits using Qiskit, Cirq, or similar frameworks\nSimulate quantum systems and analyze results\nCollaborate with hardware teams on error mitigation strategies\nPublish research findings in peer-reviewed journals\nPresent work at quantum computing conferences',
    'PhD in Physics, Computer Science, or related field\n2+ years of quantum computing research experience\nStrong background in quantum mechanics and linear algebra\nProficiency in Python and quantum programming frameworks\nPublished research in quantum computing\nExcellent analytical and problem-solving skills',
    'Experience with NISQ algorithms\nKnowledge of quantum error correction\nFamiliarity with quantum hardware platforms\nExperience with variational quantum algorithms\nBackground in quantum machine learning\nIndustry experience with quantum applications',
    'Research Excellence\nAnalytical Thinking\nInnovation\nCollaboration\nCommunication',
    'Senior',
    'Research & Development',
    'Boston, MA (Hybrid)',
    'Full-Time',
    '$180,000 - $250,000',
    '20% travel to conferences',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days'
  ),
  -- GreenFuture Technologies - Multiple Positions
  (
    '88888888-8888-8888-8888-888888888888',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'Senior Climate Data Scientist',
    'Use data science and machine learning to optimize carbon capture systems and predict climate impact.',
    'As a Senior Climate Data Scientist, you will develop ML models to optimize our carbon capture technology and create predictive models for climate impact assessment. Your work will directly contribute to our mission of removing CO2 from the atmosphere.',
    'Develop ML models for carbon capture optimization\nAnalyze climate data to predict environmental impact\nCreate dashboards for real-time system monitoring\nCollaborate with hardware engineers on sensor data analysis\nPublish findings in environmental science journals\nPresent insights to stakeholders and investors',
    'Master''s degree in Data Science, Environmental Science, or related field\n5+ years of data science experience\nStrong Python and R programming skills\nExperience with time series analysis and forecasting\nKnowledge of climate science and environmental data\nExcellent data visualization skills',
    'PhD in relevant field\nPublished research in climate science\nExperience with satellite imagery analysis\nKnowledge of atmospheric modeling\nFamiliarity with IoT sensor networks\nExperience with government climate datasets',
    'Data Analysis\nEnvironmental Impact\nProblem Solving\nCommunication\nInnovation',
    'Senior',
    'Data Science',
    'Seattle, WA (Hybrid)',
    'Full-Time',
    '$140,000 - $190,000',
    '10% travel to field sites',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days'
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'Renewable Energy Systems Engineer',
    'Design and implement smart grid solutions for renewable energy optimization and storage.',
    'As a Renewable Energy Systems Engineer, you will develop software systems that optimize renewable energy generation, storage, and distribution. You will work on cutting-edge projects involving solar, wind, and battery storage systems.',
    'Design control systems for renewable energy infrastructure\nDevelop algorithms for energy storage optimization\nImplement smart grid communication protocols\nAnalyze energy consumption patterns and optimize distribution\nIntegrate with various renewable energy hardware systems\nCreate simulation models for energy system planning',
    'Bachelor''s degree in Electrical Engineering or Computer Science\n4+ years of experience in energy systems\nProficiency in Python, C++, and MATLAB\nKnowledge of power systems and grid operations\nExperience with SCADA systems and industrial protocols\nUnderstanding of battery management systems',
    'Master''s degree in relevant field\nExperience with microgrids\nKnowledge of energy markets and trading\nFamiliarity with V2G technology\nExperience with renewable energy forecasting\nProfessional engineering license',
    'Systems Thinking\nTechnical Excellence\nSustainability Focus\nProblem Solving\nCollaboration',
    'Mid-Senior',
    'Engineering',
    'Austin, TX (Hybrid)',
    'Full-Time',
    '$120,000 - $170,000',
    '15% travel to installation sites',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'Carbon Capture Hardware Engineer',
    'Develop embedded systems and IoT solutions for our next-generation carbon capture devices.',
    'As a Carbon Capture Hardware Engineer, you will design and implement embedded systems that control and monitor our carbon capture hardware. You will work at the intersection of software and hardware to create reliable, efficient systems.',
    'Develop firmware for carbon capture control systems\nDesign IoT architecture for remote monitoring\nImplement real-time data collection and processing\nOptimize power consumption for field devices\nCreate diagnostic and maintenance tools\nCollaborate with mechanical engineers on system integration',
    'Bachelor''s degree in Computer Engineering or Electrical Engineering\n3+ years of embedded systems experience\nProficiency in C/C++ and embedded Linux\nExperience with ARM processors and RTOS\nKnowledge of IoT protocols (MQTT, CoAP)\nFamiliarity with sensor integration and calibration',
    'Experience with industrial automation\nKnowledge of chemical engineering principles\nFamiliarity with safety-critical systems\nExperience with edge computing\nBackground in environmental monitoring\nCertifications in functional safety',
    'Hardware-Software Integration\nReliability Engineering\nProblem Solving\nAttention to Detail\nInnovation',
    'Mid-Level',
    'Hardware Engineering',
    'Boulder, CO (On-site)',
    'Full-Time',
    '$110,000 - $150,000',
    '20% travel to deployment sites',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '9 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Link competencies to new positions
INSERT INTO public.position_competencies (position_id, competency_id, tenant_id, weight, created_at)
VALUES
  -- Staff Data Engineer
  ('55555555-5555-5555-5555-555555555555', 'c0c0c0c1-c0c0-c0c0-c0c0-c0c0c0c0c0c1', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 5, NOW()),
  ('55555555-5555-5555-5555-555555555555', 'c0c0c0c2-c0c0-c0c0-c0c0-c0c0c0c0c0c2', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 4, NOW()),
  ('55555555-5555-5555-5555-555555555555', 'c0c0c0c5-c0c0-c0c0-c0c0-c0c0c0c0c0c5', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 5, NOW()),
  -- Quantum Computing Engineer
  ('77777777-7777-7777-7777-777777777777', 'c0c0c0c1-c0c0-c0c0-c0c0-c0c0c0c0c0c1', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 5, NOW()),
  ('77777777-7777-7777-7777-777777777777', 'c0c0c0c2-c0c0-c0c0-c0c0-c0c0c0c0c0c2', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 5, NOW()),
  ('77777777-7777-7777-7777-777777777777', 'c0c0c0c4-c0c0-c0c0-c0c0-c0c0c0c0c0c4', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 5, NOW()),
  -- Climate Data Scientist
  ('88888888-8888-8888-8888-888888888888', 'c0c0c0c1-c0c0-c0c0-c0c0-c0c0c0c0c0c1', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 4, NOW()),
  ('88888888-8888-8888-8888-888888888888', 'c0c0c0c2-c0c0-c0c0-c0c0-c0c0c0c0c0c2', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 5, NOW()),
  ('88888888-8888-8888-8888-888888888888', 'c0c0c0c3-c0c0-c0c0-c0c0-c0c0c0c0c0c3', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 4, NOW())
ON CONFLICT (position_id, competency_id) DO NOTHING;

-- Create more diverse candidates
INSERT INTO public.candidates (id, tenant_id, company_id, email, first_name, last_name, phone, skills, experience, education, created_at, updated_at)
VALUES
  -- Data Engineering Candidates
  (
    '77777777-7777-7777-7777-777777777787',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'alex.kumar@example.com',
    'Alex',
    'Kumar',
    '+1234567896',
    ARRAY['Apache Spark', 'Airflow', 'Python', 'Scala', 'Databricks', 'Snowflake'],
    '{"years": 9, "companies": ["Uber", "LinkedIn", "Databricks"], "roles": ["Staff Data Engineer", "Senior Data Engineer", "Data Engineer"]}'::jsonb,
    '{"degree": "MS Computer Science", "school": "UC San Diego", "year": 2015}'::jsonb,
    NOW() - INTERVAL '11 days',
    NOW() - INTERVAL '11 days'
  ),
  (
    '88888888-8888-8888-8888-888888888898',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'priya.patel@example.com',
    'Priya',
    'Patel',
    '+1234567897',
    ARRAY['Kafka', 'Flink', 'Java', 'Kubernetes', 'AWS', 'Cassandra'],
    '{"years": 7, "companies": ["Twitter", "Confluent"], "roles": ["Senior Data Engineer", "Streaming Platform Engineer"]}'::jsonb,
    '{"degree": "BS Computer Engineering", "school": "Georgia Tech", "year": 2017}'::jsonb,
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days'
  ),
  -- Quantum Computing Candidates
  (
    '99999999-9999-9999-9999-999999999909',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'dr.hassan@example.com',
    'Omar',
    'Hassan',
    '+1234567898',
    ARRAY['Qiskit', 'Quantum Algorithms', 'Python', 'Linear Algebra', 'Research'],
    '{"years": 4, "companies": ["IBM Quantum", "MIT CSAIL"], "roles": ["Quantum Research Scientist", "Postdoctoral Researcher"]}'::jsonb,
    '{"degree": "PhD Physics", "school": "MIT", "year": 2020}'::jsonb,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'lisa.wong@example.com',
    'Lisa',
    'Wong',
    '+1234567899',
    ARRAY['Cirq', 'TensorFlow Quantum', 'VQE', 'QAOA', 'Error Mitigation'],
    '{"years": 3, "companies": ["Google Quantum AI", "Rigetti"], "roles": ["Quantum Software Engineer", "Quantum Algorithm Developer"]}'::jsonb,
    '{"degree": "MS Quantum Information Science", "school": "University of Waterloo", "year": 2021}'::jsonb,
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '9 days'
  ),
  -- Climate Tech Candidates
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'maria.gonzalez@example.com',
    'Maria',
    'Gonzalez',
    '+1234567900',
    ARRAY['Python', 'R', 'Climate Modeling', 'Time Series', 'Satellite Data'],
    '{"years": 6, "companies": ["NOAA", "Climate.ai", "Planet Labs"], "roles": ["Senior Climate Data Scientist", "Environmental Data Analyst"]}'::jsonb,
    '{"degree": "PhD Environmental Science", "school": "Stanford University", "year": 2018}'::jsonb,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'james.oconnor@example.com',
    'James',
    'O''Connor',
    '+1234567901',
    ARRAY['SCADA', 'Python', 'MATLAB', 'Grid Systems', 'Battery Storage'],
    '{"years": 5, "companies": ["Tesla Energy", "NextEra Energy"], "roles": ["Energy Systems Engineer", "Grid Software Developer"]}'::jsonb,
    '{"degree": "MS Electrical Engineering", "school": "UT Austin", "year": 2019}'::jsonb,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'rachel.kim@example.com',
    'Rachel',
    'Kim',
    '+1234567902',
    ARRAY['Embedded C', 'ARM', 'IoT', 'RTOS', 'Sensor Networks'],
    '{"years": 4, "companies": ["Honeywell", "Bosch"], "roles": ["Embedded Systems Engineer", "IoT Developer"]}'::jsonb,
    '{"degree": "BS Computer Engineering", "school": "UCLA", "year": 2020}'::jsonb,
    NOW() - INTERVAL '13 days',
    NOW() - INTERVAL '13 days'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    'andre.silva@example.com',
    'Andre',
    'Silva',
    '+1234567903',
    ARRAY['Rust', 'Move', 'Aptos', 'Sui', 'Zero-Knowledge Proofs'],
    '{"years": 2, "companies": ["Aptos Labs", "Facebook Diem"], "roles": ["Blockchain Core Developer", "Crypto Engineer"]}'::jsonb,
    '{"degree": "MS Cryptography", "school": "ETH Zurich", "year": 2022}'::jsonb,
    NOW() - INTERVAL '16 days',
    NOW() - INTERVAL '16 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create additional interview sessions
INSERT INTO public.interview_sessions (id, tenant_id, candidate_id, position_id, company_id, start_time, end_time, status, created_at, updated_at)
VALUES
  -- Data Engineering interviews
  (
    '77777777-7777-7777-7777-777777777797',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '77777777-7777-7777-7777-777777777787',
    '55555555-5555-5555-5555-555555555555',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days' + INTERVAL '1 hour',
    'completed',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
  ),
  (
    '88888888-8888-8888-8888-888888888808',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '88888888-8888-8888-8888-888888888898',
    '55555555-5555-5555-5555-555555555555',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    NOW() + INTERVAL '3 days',
    NULL,
    'scheduled',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  -- Quantum Computing interviews
  (
    '99999999-9999-9999-9999-999999999919',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '99999999-9999-9999-9999-999999999909',
    '77777777-7777-7777-7777-777777777777',
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '50 minutes',
    'completed',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
  ),
  -- Climate Tech interviews
  (
    'cccccccc-cccc-cccc-cccc-cccccccccc0c',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '88888888-8888-8888-8888-888888888888',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days' + INTERVAL '45 minutes',
    'completed',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddd1d',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '99999999-9999-9999-9999-999999999999',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    NOW() + INTERVAL '1 day',
    NULL,
    'scheduled',
    NOW(),
    NOW()
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee2e',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    NOW() + INTERVAL '4 days',
    NULL,
    'scheduled',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create transcript entries for new completed sessions
INSERT INTO public.transcript_entries (id, session_id, tenant_id, start_ms, speaker, text, created_at)
VALUES
  -- Alex Kumar's interview
  ('f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f771', '77777777-7777-7777-7777-777777777797', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 0, 'interviewer', 'Hi Alex, welcome! I see you have extensive experience with data platforms. Can you tell me about your work at Databricks?', NOW() - INTERVAL '4 days'),
  ('f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f772', '77777777-7777-7777-7777-777777777797', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 18000, 'candidate', 'Thank you! At Databricks, I led the design of a multi-region data lake architecture that processed over 50TB daily. We used Delta Lake for ACID transactions and implemented a medallion architecture...', NOW() - INTERVAL '4 days'),
  ('f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f773', '77777777-7777-7777-7777-777777777797', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 45000, 'interviewer', 'Impressive! How did you handle data quality and governance at that scale?', NOW() - INTERVAL '4 days'),
  ('f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f774', '77777777-7777-7777-7777-777777777797', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 60000, 'candidate', 'We implemented a comprehensive data quality framework using Great Expectations and custom Spark jobs. For governance, we used Unity Catalog...', NOW() - INTERVAL '4 days'),
  
  -- Dr. Hassan's quantum interview
  ('f9f9f9f9-f9f9-f9f9-f9f9-f9f9f9f9f991', '99999999-9999-9999-9999-999999999919', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 0, 'interviewer', 'Dr. Hassan, your work on quantum error mitigation is fascinating. Can you explain your approach to making NISQ devices more reliable?', NOW() - INTERVAL '2 days'),
  ('f9f9f9f9-f9f9-f9f9-f9f9-f9f9f9f9f992', '99999999-9999-9999-9999-999999999919', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 20000, 'candidate', 'Thank you! My research focused on zero-noise extrapolation and probabilistic error cancellation. At IBM Quantum, we developed a framework that improved algorithm fidelity by 40%...', NOW() - INTERVAL '2 days'),
  ('f9f9f9f9-f9f9-f9f9-f9f9-f9f9f9f9f993', '99999999-9999-9999-9999-999999999919', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 48000, 'interviewer', 'How do you see quantum computing impacting real-world applications in the next 5 years?', NOW() - INTERVAL '2 days'),
  ('f9f9f9f9-f9f9-f9f9-f9f9-f9f9f9f9f994', '99999999-9999-9999-9999-999999999919', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 65000, 'candidate', 'I believe we will see significant breakthroughs in drug discovery and materials science. Variational quantum eigensolvers are already showing promise...', NOW() - INTERVAL '2 days'),
  
  -- Maria's climate tech interview
  ('fcfcfcfc-fcfc-fcfc-fcfc-fcfcfcfcfcc1', 'cccccccc-cccc-cccc-cccc-cccccccccc0c', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 0, 'interviewer', 'Maria, welcome! Your experience with satellite data analysis is exactly what we need. Can you describe your work at Planet Labs?', NOW() - INTERVAL '6 days'),
  ('fcfcfcfc-fcfc-fcfc-fcfc-fcfcfcfcfcc2', 'cccccccc-cccc-cccc-cccc-cccccccccc0c', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 15000, 'candidate', 'At Planet Labs, I developed ML models to analyze daily satellite imagery for deforestation detection. We processed petabytes of data to track carbon sequestration in real-time...', NOW() - INTERVAL '6 days'),
  ('fcfcfcfc-fcfc-fcfc-fcfc-fcfcfcfcfcc3', 'cccccccc-cccc-cccc-cccc-cccccccccc0c', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 40000, 'interviewer', 'How would you approach optimizing our carbon capture systems using data science?', NOW() - INTERVAL '6 days'),
  ('fcfcfcfc-fcfc-fcfc-fcfc-fcfcfcfcfcc4', 'cccccccc-cccc-cccc-cccc-cccccccccc0c', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 55000, 'candidate', 'I would start by implementing a comprehensive sensor network to collect real-time data on capture efficiency, then use time series forecasting and optimization algorithms...', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-- Create interview invitations for scheduled sessions
INSERT INTO public.interview_invitations (token, tenant_id, session_id, candidate_id, expires_at, status, created_at, updated_at)
VALUES
  (
    '93939393-9393-9393-9393-939393939393',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '88888888-8888-8888-8888-888888888808',
    '88888888-8888-8888-8888-888888888898',
    NOW() + INTERVAL '8 days',
    'pending',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    '94949494-9494-9494-9494-949494949494',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'dddddddd-dddd-dddd-dddd-dddddddddd1d',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    NOW() + INTERVAL '6 days',
    'pending',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '95959595-9595-9595-9595-959595959595',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee2e',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    NOW() + INTERVAL '9 days',
    'pending',
    NOW(),
    NOW()
  )
ON CONFLICT (token) DO NOTHING;

-- Create candidate assessments for new completed interviews
INSERT INTO public.candidate_assessments (id, tenant_id, session_id, details, weighted_score, created_at, updated_at)
VALUES
  (
    'a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a777',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '77777777-7777-7777-7777-777777777797',
    '{
      "competency_scores": {"Technical Excellence": 4.9, "Problem Solving": 4.7, "Leadership": 4.8, "Collaboration": 4.2, "Strategic Thinking": 4.5},
      "overall_score": 4.6,
      "strengths": ["Exceptional data architecture skills", "Strong leadership experience", "Deep knowledge of modern data stack"],
      "areas_for_improvement": ["Could expand ML/AI integration experience", "Limited experience with real-time streaming at our scale"],
      "recommendation": "Outstanding candidate for Staff Data Engineer. Strong hire - extend offer immediately."
    }'::jsonb,
    4.6,
    NOW() - INTERVAL '4 days' + INTERVAL '2 hours',
    NOW() - INTERVAL '4 days' + INTERVAL '2 hours'
  ),
  (
    'a9a9a9a9-a9a9-a9a9-a9a9-a9a9a9a9a999',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '99999999-9999-9999-9999-999999999919',
    '{
      "competency_scores": {"Technical Excellence": 5.0, "Problem Solving": 4.9, "Innovation": 4.8, "Collaboration": 4.3, "Communication": 4.4},
      "overall_score": 4.7,
      "strengths": ["World-class quantum expertise", "Published researcher", "Strong theoretical and practical knowledge"],
      "areas_for_improvement": ["Limited industry experience outside research", "Could improve business communication"],
      "recommendation": "Exceptional quantum computing expert. Perfect fit for our research team. Extend offer."
    }'::jsonb,
    4.7,
    NOW() - INTERVAL '2 days' + INTERVAL '2 hours',
    NOW() - INTERVAL '2 days' + INTERVAL '2 hours'
  ),
  (
    'acacacac-acac-acac-acac-acacacacac0c',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'cccccccc-cccc-cccc-cccc-cccccccccc0c',
    '{
      "competency_scores": {"Data Analysis": 4.6, "Environmental Impact": 4.8, "Problem Solving": 4.4, "Communication": 4.5, "Innovation": 4.3},
      "overall_score": 4.5,
      "strengths": ["Strong climate science background", "Excellent satellite data expertise", "Passionate about environmental impact"],
      "areas_for_improvement": ["Limited experience with hardware integration", "Could expand knowledge of carbon capture technology"],
      "recommendation": "Great fit for Climate Data Scientist role. Recommend proceeding to offer stage."
    }'::jsonb,
    4.5,
    NOW() - INTERVAL '6 days' + INTERVAL '2 hours',
    NOW() - INTERVAL '6 days' + INTERVAL '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- Update the setup-local-test-data.sh script comment to include the new company
-- Note: The actual script will need to be updated to create:
-- - admin@greenfuture.com (Tenant Admin for GreenFuture Technologies)
-- - interviewer@greenfuture.com (Tenant Interviewer for GreenFuture Technologies)
-- - One interviewer with access to all 3 companies
-- - One interviewer with access to just 1 company