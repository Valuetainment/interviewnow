-- Supabase Seed Data
-- This file creates test data for development and testing purposes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test tenant
INSERT INTO public.tenants (id, name, plan_tier, created_at, updated_at)
VALUES 
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Test Company Inc', 'pro', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test auth users
-- Note: In Supabase, you typically create auth users through the dashboard or API
-- This is a placeholder showing the structure. Use Supabase Auth API to create actual users
-- Example users:
-- Email: admin@testcompany.com, Password: TestPassword123!
-- Email: user@testcompany.com, Password: TestPassword123!
-- Email: candidate1@example.com, Password: TestPassword123!

-- Create test users in public schema (assuming auth users exist)
-- NOTE: These are commented out because auth users must be created first
-- Use the setup-test-data-local.sh script to create auth users, then uncomment these
-- -- Admin user
-- INSERT INTO public.users (id, tenant_id, role, created_at, updated_at)
-- VALUES 
--   ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'admin', NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;

-- -- Regular user
-- INSERT INTO public.users (id, tenant_id, role, created_at, updated_at)
-- VALUES 
--   ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'user', NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;

-- Create test companies
INSERT INTO public.companies (id, tenant_id, name, culture, story, values, benefits, core_values, benefits_list, created_at, updated_at)
VALUES 
  (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'TechCorp Solutions',
    'We foster a culture of innovation, collaboration, and continuous learning. Our team members are encouraged to take ownership, experiment with new ideas, and grow both personally and professionally.',
    'Founded in 2015, TechCorp Solutions started as a small startup with a big vision: to revolutionize how businesses leverage AI and machine learning. Today, we''re a leading provider of AI-powered solutions serving Fortune 500 companies worldwide.',
    'Innovation, Integrity, Impact, Inclusion',
    'Comprehensive health insurance, 401k matching, flexible work arrangements, unlimited PTO, professional development budget',
    '["Innovation", "Integrity", "Impact", "Inclusion", "Continuous Learning"]'::jsonb,
    '["Health Insurance", "401k Matching", "Remote Work", "Unlimited PTO", "Learning Budget", "Stock Options"]'::jsonb,
    NOW(),
    NOW()
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

-- Create test positions
INSERT INTO public.positions (id, tenant_id, title, description, company_id, experience_level, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'Senior Software Engineer',
    '# Senior Software Engineer

## About the Role
We are seeking an experienced Senior Software Engineer to join our growing engineering team. You will be responsible for designing, developing, and maintaining scalable web applications using modern technologies.

## Responsibilities
- Design and implement robust, scalable software solutions
- Mentor junior developers and conduct code reviews
- Collaborate with product managers and designers
- Contribute to architectural decisions
- Ensure code quality and best practices

## Requirements
- 5+ years of software development experience
- Strong proficiency in JavaScript/TypeScript and React
- Experience with Node.js and RESTful APIs
- Familiarity with cloud platforms (AWS/GCP/Azure)
- Excellent problem-solving skills

## Nice to Have
- Experience with WebRTC and real-time applications
- Knowledge of AI/ML integration
- Open source contributions
- Experience with microservices architecture',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'Senior',
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'Product Manager',
    '# Product Manager

## About the Role
We are looking for a Product Manager to lead our AI interview platform product development. You will work closely with engineering, design, and sales teams to deliver exceptional products.

## Responsibilities
- Define product vision and roadmap
- Gather and prioritize product requirements
- Work with engineering to deliver features
- Analyze user feedback and metrics
- Coordinate product launches

## Requirements
- 3+ years of product management experience
- Experience with B2B SaaS products
- Strong analytical and communication skills
- Technical background preferred
- Customer-focused mindset',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'Mid-level',
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

-- Create test candidates
INSERT INTO public.candidates (id, tenant_id, full_name, email, phone, skills, experience, education, resume_text, resume_analysis, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111112',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'John Smith',
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
    'Sarah Johnson',
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
    'Michael Chen',
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
  )
ON CONFLICT (id) DO NOTHING;

-- Create test interview sessions
INSERT INTO public.interview_sessions (id, tenant_id, position_id, candidate_id, start_time, end_time, status, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111115',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111112',
    NOW() + INTERVAL '2 days',
    NULL,
    'scheduled',
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222226',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222223',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '45 minutes',
    'completed',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
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

-- Add some test transcript entries for completed interview
INSERT INTO public.transcript_entries (id, tenant_id, session_id, speaker, text, start_ms, confidence, created_at)
VALUES 
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
    'Thank you for having me. I have been working as a Product Manager for the past 3 years at a B2B SaaS company...',
    15000,
    0.92,
    NOW() - INTERVAL '1 day' + INTERVAL '15 seconds'
  )
ON CONFLICT (id) DO NOTHING;

-- Output helpful information
DO $$
BEGIN
  RAISE NOTICE 'Seed data created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Test Tenant ID: d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0';
  RAISE NOTICE '';
  RAISE NOTICE 'To use this seed data, create the following auth users in Supabase Dashboard:';
  RAISE NOTICE '1. Admin User:';
  RAISE NOTICE '   - Email: admin@testcompany.com';
  RAISE NOTICE '   - Password: TestPassword123!';
  RAISE NOTICE '   - User ID: a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
  RAISE NOTICE '';
  RAISE NOTICE '2. Regular User:';
  RAISE NOTICE '   - Email: user@testcompany.com';
  RAISE NOTICE '   - Password: TestPassword123!';
  RAISE NOTICE '   - User ID: b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';
  RAISE NOTICE '';
  RAISE NOTICE '3. Candidate User:';
  RAISE NOTICE '   - Email: candidate1@example.com';
  RAISE NOTICE '   - Password: TestPassword123!';
  RAISE NOTICE '   - User ID: (any UUID)';
END $$; 