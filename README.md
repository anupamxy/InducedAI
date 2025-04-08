# Rate Limiting Proxy API

A proxy service that manages API keys and enforces configurable rate limits for third-party APIs.

##  Overview

This application acts as a middleware between your client applications and external APIs, providing:

-  User authentication and API key management  
-  Multiple rate limiting strategies  
-  Request queuing for smooth handling during traffic spikes  
-  Detailed analytics and usage tracking  
-  API registration with custom configuration

---

##  Features

###  Multiple Rate Limiting Strategies
- **Token Bucket**
- **Leaky Bucket**
- **Fixed Window**
- **Sliding Window**

###  User Management
- User registration and login
- Secure API key generation & regeneration

###  API Management
- Register multiple APIs with unique configurations
- Customize rate limit strategy and authentication tokens
- Enable/disable APIs without losing settings

###  Request Handling
- Queuing of requests when rate limits are exceeded
- Cancel queued requests
- View request logs

###  Analytics Dashboard
- Real-time usage statistics
- Rate-limit hit stats
- Queue monitoring & graphs

---

##  Technologies Used

### Backend
- Node.js + Express  
- TypeScript  
- PostgreSQL with Drizzle ORM  
- express-session + connect-pg-simple  

### Frontend
- React + TypeScript  
- TanStack React Query  
- Shadcn UI  
- Recharts  
- Tailwind CSS  



##  Prerequisites

- Node.js (v18+)
- PostgreSQL (v13+)
- npm or yarn



##  Environment Variables

I have already created .env files for POSTGRESQL DB Connection
For Local start just we need to add node modules for that just do npm i
