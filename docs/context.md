# Andres Isaac Alvarez Herrera — Portfolio Context

This file describes the portfolio project. It is used to give full context to any AI assistant at the start of a session.

Paste this file at the beginning of any chat to avoid re-explaining the project from scratch.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Project name | `portfolio` |
| Owner | Andres Isaac Alvarez Herrera |
| Project type | Portfolio CRM — Personal portfolio management system with admin panel |
| Industry | Cloud / Software Development / AWS Serverless |
| Stage | In development |
| Repository | TBD |

---

## 2. What This Project Is

This is a CRM-style portfolio: a public website for recruiters and clients, and a private admin panel where Andres can manage all professional content without editing code.

The public side shows professional information (projects, experience, skills, certifications, contact). The admin panel controls projects, case studies, experience, skills, certifications, screenshots, CV files, social links, contact messages, and publication status.

This portfolio is not only a personal website — it becomes a real serverless business-style application that demonstrates authentication, CRUD operations, media management, database design, deployment, and AWS architecture.

---

## 3. Professional Positioning

**Title:** Junior Solutions Architect / AWS Serverless Developer

**Core message:** AWS-certified cloud professional focused on building practical serverless applications, CRM systems, e-commerce platforms, and cloud-based business solutions using AWS, TypeScript, Python, and modern web technologies.

**Location:** Cochabamba, Bolivia

**Current role:** Junior Solutions Architect at Methodica Technology (Feb 2026 – Present, Part-time)

**Previous role:** IT & Cloud Intern at Methodica Technology (Nov 2025 – Feb 2026)

---

## 4. Users and Roles

| Role | Description |
|---|---|
| `admin` | Andres — full access to admin panel, manages all content |
| `public` | Recruiters, clients, visitors — view-only access to public portfolio |

---

## 5. Business Rules

- Only Andres can access the admin panel (Cognito authentication, admin-only group).
- Projects can be marked as `draft` or `published` — only published projects appear on the public site.
- Projects can be marked as `featured` — featured projects appear on the homepage.
- Contact messages are saved in DynamoDB before sending email notifications.
- Contact form uses basic spam protection: honeypot field, rate limit by IP, message length limits.
- CV file uploads replace the previous CV file.
- Screenshots and images are uploaded to S3 and served through CloudFront.
- All sensitive AWS identifiers (account IDs, bucket names, CloudFront IDs, Cognito IDs, API URLs) must be sanitized before public display.

---

## 6. Key Entities

| Entity | Description |
|---|---|
| `PROFILE_SETTINGS` | Andres' name, title, summary, location, social links, CV file |
| `PROJECT` | Portfolio project with title, description, tech stack, screenshots, case study, featured status, publish status |
| `EXPERIENCE` | Professional role with company, title, dates, description, current/past status |
| `SKILL` | Technical skill with name, category, visibility |
| `CERTIFICATION` | AWS or technical certification with name, badge, verification link, expiration date |
| `MEDIA` | Uploaded images, screenshots, architecture diagrams, CV files, certification badges |
| `CONTACT_MESSAGE` | Contact form submission with name, email, subject, message, status (unread/read/archived) |
| `CASE_STUDY` | Detailed project case study with problem, solution, architecture, challenges, results |

---

## 7. Main Flows

**Public visitor flow:**
Visitor lands on homepage → sees hero, featured projects, experience preview, skills, certifications → clicks "View Projects" → browses project cards → clicks project → reads case study with architecture, tech stack, screenshots → clicks "Contact Me" → fills contact form → message saved and email sent to Andres.

**Admin login flow:**
Andres navigates to `/admin` → enters email and password → Cognito validates credentials → frontend stores session → redirects to admin dashboard.

**Admin project creation flow:**
Andres logs into admin panel → navigates to Projects → clicks "Create Project" → fills form with title, description, tech stack, problem, solution, architecture → uploads screenshots to S3 → marks as featured or draft → saves → project appears in admin project list → toggles publish status → project appears on public site.

**Contact form flow:**
Visitor fills contact form → frontend calls `POST /contact` → Lambda validates input → saves message in DynamoDB → sends email notification to Andres using SES → returns success → visitor sees confirmation message.

---

## 8. AWS Configuration

| Setting | Value |
|---|---|
| AWS Account ID | `<sanitized-for-public>` |
| Region | `us-east-1` |
| Project name (CDK) | `portfolio` |
| Dev environment | `portfolio-dev` |
| Prod environment | `portfolio-prod` |

---

## 9. Tech Stack

This project follows the standard stack defined in `docs/config.md`.

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + React Router + TailwindCSS + Ant Design |
| Forms | React Hook Form + Yup |
| Backend | Python 3.12 Lambda functions |
| Database | Amazon DynamoDB |
| Auth | Amazon Cognito (admin-only access using Cognito groups) |
| API | Amazon API Gateway REST API |
| Storage | Amazon S3 (images, CV, screenshots, architecture diagrams) |
| CDN | Amazon CloudFront |
| Email | Amazon SES |
| Infrastructure | AWS CDK TypeScript |
| CI/CD | CodePipeline + CodeBuild + CodeDeploy |

---

## 10. Repository Structure

```text
/
├── front/
│   └── src/
│       ├── config/
│       ├── constants/
│       ├── context/
│       ├── hooks/
│       ├── services/
│       ├── components/
│       ├── pages/
│       └── types/
├── lambdas/
│   ├── projects/
│   ├── experience/
│   ├── skills/
│   ├── certifications/
│   ├── media/
│   ├── contact/
│   └── profile/
├── infra/
│   ├── bin/
│   ├── lib/
│   │   ├── app-stack.ts
│   │   ├── app-stage.ts
│   │   ├── pipeline-stack.ts
│   │   └── constructs/
│   │       ├── auth.ts
│   │       ├── database.ts
│   │       ├── lambdas.ts
│   │       ├── api.ts
│   │       ├── frontend-hosting.ts
│   │       ├── monitoring.ts
│   │       ├── security.ts
│   │       └── async-processing.ts
│   └── config/
│       ├── dev.ts
│       ├── staging.ts
│       └── prod.ts
├── docs/
│   ├── config.md
│   ├── context.md
│   ├── project-settings/
│   └── tickets/
└── README.md
```

---

## 11. Public Website Sections

```text
portfolio/
├── home
│   ├── hero
│   ├── featured-projects
│   ├── experience-preview
│   ├── skills-preview
│   ├── certifications-preview
│   └── contact-cta
├── projects
│   ├── project-cards
│   ├── filters-by-category
│   └── search
├── projects/:slug
│   ├── overview
│   ├── problem
│   ├── solution
│   ├── architecture
│   ├── tech-stack
│   ├── screenshots
│   ├── result
│   └── links
├── experience
├── skills
├── certifications
├── about
└── contact
```

---

## 12. Admin Panel Sections

```text
admin/
├── login
├── dashboard
│   ├── total-projects
│   ├── featured-projects
│   └── recent-updates
├── projects
│   ├── create-project
│   ├── edit-project
│   ├── upload-screenshots
│   ├── manage-case-study
│   ├── toggle-featured
│   └── publish-unpublish
├── experience
│   ├── create-role
│   ├── edit-role
│   └── reorder-roles
├── skills
│   ├── create-skill
│   ├── edit-skill
│   └── group-by-category
├── certifications
│   ├── create-certification
│   ├── upload-badge
│   └── add-verification-link
├── media
│   ├── upload-image
│   ├── manage-screenshots
│   └── manage-cv-file
└── settings
    ├── profile-info
    ├── social-links
    ├── cv-download
    └── featured-project-order
```

---

## 13. Featured Projects

### 1. Methodica Technology — Corporate Website & Admin Platform

**Type:** Corporate website with admin panel  
**Category:** AWS serverless web platform / CMS / careers and content management  
**Technologies:** Vite, React 19, TypeScript, React Router 7, TailwindCSS, Ant Design, React Hook Form, Yup, AWS Cognito, AWS Amplify, DynamoDB, S3, API Gateway, Lambda with Python, CloudFront, AWS CDK with TypeScript

**What it demonstrates:**
- Corporate website architecture
- Serverless CMS-style backend
- Protected administration panel
- Dynamic content management with DynamoDB
- Cognito-based authentication
- Frontend deployment with S3 and CloudFront
- Infrastructure as Code with AWS CDK
- Real company website implementation

---

### 2. JAM Construcciones — Real Estate CRM & Inventory Management System

**Type:** Production-style business management system  
**Category:** AWS serverless CRM / real estate inventory system  
**Status:** Active modules completed; demo deployment pending for final portfolio presentation  
**Technologies:** React 19, Vite 8, Ant Design 6, TypeScript, Amazon Cognito, AWS Amplify, API Gateway REST, Python 3.12 Lambda, DynamoDB, SQS, EventBridge Scheduler, SES, S3, CloudFront, AWS CDK with TypeScript

**Key features:**
- Authentication with Cognito, role-based access, optional MFA
- User and real estate agency management
- Real estate project, stage, tower, and unit inventory management
- Real-time unit blocking for 48 hours
- Automatic block release using EventBridge Scheduler
- Customer registration with 3-month exclusivity by customer and project
- Sales workflow from lead capture to reservation
- CRM status changes with full change history
- Email notifications using SQS, Lambda, and SES
- Bulk inventory import from Excel files
- Dashboard with commercial KPIs and charts
- Public capture link for real estate agencies
- Integrated AI assistant concept for CRM support

**What it demonstrates:**
- Real business system architecture
- Advanced serverless backend design
- DynamoDB modeling with GSIs
- Role-based authentication and authorization
- Event-driven automation
- Production-style deployment workflow
- Technical documentation and ticket-based development

---

### 3. SportShop — Serverless E-commerce Platform

**Type:** Full serverless e-commerce application  
**Category:** AWS serverless / e-commerce  
**Technologies:** AWS CDK, TypeScript, Lambda, API Gateway, DynamoDB, Cognito, S3, CloudFront

**Key features:**
- Public storefront
- Authenticated admin panel
- Product CRUD operations
- Shopping cart management
- Order management
- Sales CSV export
- Image upload to S3
- Pay-per-use infrastructure
- Automatic scaling

**What it demonstrates:**
- Serverless e-commerce architecture
- Infrastructure as Code with AWS CDK
- DynamoDB-based application design
- Authentication with Cognito
- API Gateway and Lambda backend integration
- Cost-aware cloud design

---

### 4. Automotive Workshop — Serverless Management System

**Type:** Serverless backend system  
**Category:** AWS backend / business management system  
**Technologies:** AWS CDK, Python 3.11, Lambda, API Gateway, DynamoDB, Cognito, S3, CloudWatch

**Key features:**
- Customer management
- Vehicle management
- Work order lifecycle
- Inventory and kardex tracking
- Billing from work orders
- Quick sales flow
- Role-based access for admin, mechanic, and receptionist
- Atomic transactions for critical operations
- Audit history of changes

**Technical highlights:**
- 30 Lambda functions
- 9 DynamoDB tables with optimized GSIs
- 33 REST endpoints
- Cognito authentication
- CloudWatch monitoring
- Estimated cost of around $20/month for a small workshop

**What it demonstrates:**
- Serverless backend architecture
- Python Lambda development
- DynamoDB data modeling
- REST API design
- Role-based access control
- Business workflow modeling

---

### 5. Text-to-Voice — Amazon Polly Application

**Type:** Serverless text-to-speech web application  
**Category:** AWS serverless / AI media processing  
**Technologies:** AWS CDK, TypeScript, Amazon Polly, Lambda, API Gateway, S3, CloudFront, React

**Key features:**
- Text-to-speech conversion
- Neural voice support
- Multiple voices and languages
- MP3 audio generation
- Audio playback and download
- S3 storage for generated files
- Global delivery through CloudFront
- Low operating cost

**What it demonstrates:**
- AWS AI service integration
- Serverless processing
- File generation and storage workflow
- CloudFront distribution
- React frontend integration with AWS backend

---

### 6. Study Cloud — AWS Learning Platform

**Type:** Static learning platform  
**Category:** AWS education / cloud documentation  
**Technologies:** HTML, CSS, JavaScript, Amazon S3, CloudFront, AWS CLI

**Key features:**
- Structured AWS Cloud Practitioner content
- Organized sections by exam domain and service category
- Responsive static website
- S3 static hosting
- CloudFront global distribution
- AWS CLI-based deployment updates

**What it demonstrates:**
- AWS content organization
- Static website deployment on AWS
- CloudFront distribution and cache invalidation
- Technical communication and documentation
- Practical certification preparation

---

## 14. Professional Experience

### Manager, Technology & Software Development Department — Methodica Technology
**May 2026 – Present**

Especialista en soluciones cloud, DevOps y desarrollo de software, con experiencia en el diseño e implementación de arquitecturas escalables en AWS, automatización de infraestructura y desarrollo de sistemas empresariales. Lidera iniciativas tecnológicas orientadas a la innovación, optimización de procesos y creación de soluciones digitales eficientes para el crecimiento empresarial.

### Junior Solutions Architect — Methodica Technology
**Feb 2026 – Present | Part-time**

- Support AWS-oriented technical initiatives and cloud-related tasks
- Contribute to architecture decisions, solution planning, and technical documentation
- Help define scalable, secure, and serverless solutions based on AWS best practices
- Collaborate with technical teams on solution design, deployment, and optimization
- Apply AWS Well-Architected principles with focus on security, performance, reliability, and cost efficiency

### IT & Cloud Intern — Methodica Technology
**Nov 2025 – Feb 2026**

- Supported cloud-related tasks and AWS-oriented project activities
- Participated in implementation, organization, and follow-up of technology projects in a professional environment
- Strengthened practical knowledge of cloud services, solution design, and technical documentation
- Practiced daily AWS configuration tasks involving IAM, VPC, Security Groups, EC2, Auto Scaling, Load Balancing, monitoring, and cloud infrastructure fundamentals

---

## 15. Certifications

- AWS Certified Solutions Architect – Associate
- AWS Certified Cloud Practitioner

---

## 16. Technical Skills

**Cloud — AWS**

Core AWS Services:
- IAM, VPC, Security Groups: daily configuration and cloud practice at Methodica
- EC2, Auto Scaling, Elastic Load Balancing: used and practiced during IT & Cloud Intern responsibilities
- S3, CloudFront: used in Study Cloud and SportShop for static hosting, assets, and global distribution
- Lambda, API Gateway: used in SportShop and other serverless backend projects
- DynamoDB: used in SportShop and serverless backend projects
- RDS/Aurora: studied and practiced through AWS training and architecture exercises
- Cognito: used for authentication in SportShop and serverless applications
- CloudWatch: used for monitoring, logs, and operational visibility

Infrastructure as Code:
- AWS CDK with TypeScript: used to build SportShop and serverless project infrastructure
- Terraform: DevOps training and infrastructure-as-code practice
- CloudFormation: understood through AWS CDK-generated stacks and AWS training
- AWS CLI: used for Study Cloud deployment automation, S3 sync, and CloudFront invalidations

Generative AI & Machine Learning Foundations:
- AWS Bedrock: studied through Generative AI Foundations training
- Amazon SageMaker: studied through Machine Learning Foundations training
- Generative AI Concepts: AWS Academy Graduate background
- Machine Learning Foundations: AWS Educate badge / foundational training

AWS Well-Architected Knowledge:
- Operational Excellence: Well-Architected training and badge
- Security Best Practices: AWS security training and practical application in projects
- Reliability: Solutions Architect Quest and AWS architecture practice
- Cost Optimization: serverless architecture decisions and pay-per-use design

**Programming & Backend**
- Python (Python 3.11 / 3.12)
- TypeScript
- JavaScript
- REST APIs
- AWS Lambda functions
- API design
- Serverless backend development

**Frontend**
- React
- Vite
- Ant Design
- HTML
- CSS
- JavaScript
- TypeScript
- Responsive design

**Databases**
- DynamoDB
- NoSQL data modeling
- Global Secondary Indexes
- RDS / Aurora fundamentals

**DevOps & Tools**
- AWS CDK
- Git
- GitHub
- Terraform fundamentals
- AWS CLI
- CloudFront invalidations
- S3 static hosting
- Basic CI/CD concepts

**Architecture Concepts**
- Serverless architecture
- Authentication and authorization
- REST APIs
- Event-driven architecture
- Scalability
- Cloud security basics
- Monitoring and logging
- Cost optimization
- Technical documentation

---

## 17. Current Status

**Phase:** Phase 2 — Feature development in progress

**Completed:**
- All Phase 1 tickets (TK-01 to TK-22) — architecture, infrastructure, frontend foundation
- TK-23 — First deploy to dev (AppStack deployed, admin user created, PROFILE_SETTINGS seeded)
- TK-24 — Profile module (GET/PUT /profile, AboutPage, ProfileSettingsPage)

**In progress:**
- Phase 2 project tickets (TK-25 onwards)
- Setting up CI/CD pipeline (dev and prod pipelines)

**Pending:**
- Phase 2 remaining feature tickets (projects, experience, skills, certifications, media, contact)
- Phase 3 mandatory closing tickets (security, monitoring, deployment)

---

## 18. MVP Scope

**Version 1:**
- Public portfolio website
- Projects page
- Project detail pages
- Admin login
- CRUD for projects
- Upload screenshots to S3
- Manage profile settings
- Manage CV file

**Version 2:**
- CRUD for experience
- CRUD for skills
- CRUD for certifications
- Case study editor
- Project status: draft / published
- Featured project ordering

**Version 3:**
- Blog or technical notes
- Analytics dashboard
- Contact form saved in DynamoDB
- Email notifications with SES
- Multi-language support: English / Spanish

---

## 19. Contact Form Flow

```text
Public Contact Form
↓
POST /contact
↓
API Gateway
↓
Lambda contact-handler
↓
DynamoDB contact-messages
↓
Amazon SES
↓
Email notification to Andres
```

**Contact form fields:**
- name
- email
- subject
- message
- projectType (optional)
- budget (optional)
- company (optional)
- createdAt
- status: unread | read | archived

**Spam protection:**
- Honeypot field
- Rate limit by IP
- Message length limits

---

## 20. Public Portfolio Security Notes

**Important:** Do not publish sensitive infrastructure details such as:
- AWS account IDs
- Bucket names
- CloudFront distribution IDs
- Internal emails
- Environment variables
- Exact Cognito IDs
- Production resource names

For the public portfolio, show the architecture and technical decisions, but sanitize private identifiers.

---

## 21. Next Steps

**For each project, prepare:**
- GitHub repository link
- Live demo link if available
- 2–4 screenshots
- 1 architecture diagram for AWS projects
- Short case study page
- Clear explanation of personal contribution

**Best first case studies to write:**
1. Methodica Technology
2. JAM Construcciones
3. SportShop
4. Automotive Workshop
5. Text-to-Voice

---

## 22. How to Use This File

- Paste this file at the start of any AI chat session to give full portfolio project context
- Update this file whenever the project status, features, or key decisions change
- Keep it short and factual — this is not a technical spec, it is a context summary
- The full technical standard lives in `docs/config.md`
- The full project documentation lives in `docs/project-settings/`
