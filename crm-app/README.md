# Workflow System - Role-Based Workflow for Bill Processing

A comprehensive React-based Workflow application built with Next.js that implements a role-based workflow system for bill processing. The system supports sequential workflow stages with proper access control, audit trails, and user management.

## Features

### Core Workflow Stages
1. **Bill Upload & Submission** - Users can upload bills and initiate approval requests
2. **Bill Approval** - Reviewers can approve or reject submitted bills
3. **Data Entry** - Approved bills undergo detailed data entry with line items
4. **Data Entry Approval** - Data entries are reviewed and approved
5. **Verification & Final Approval** - Final verification and approval stage

### Role-Based Access Control
- **Admin**: Full access to all stages, user management, and role assignment
- **Submitter**: Upload bills and initiate approval requests
- **Approver**: Review and approve/reject bill submissions
- **Data Entry**: Enter data for approved bills
- **Data Approver**: Approve/reject entered data
- **Verifier**: Final verification and approval

### Key Features
- Sequential workflow enforcement
- Comprehensive audit trail with timestamps and user tracking
- Role-based UI restrictions
- User management with role assignment
- Admin override capabilities
- Real-time status tracking

## Technology Stack

- **Frontend**: React 18 with Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: React Context API with useReducer
- **Authentication**: Context-based auth system
- **Build Tool**: Next.js with Turbopack support

## Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd CRM
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Demo Accounts

The application comes with pre-configured demo accounts for testing:

| Username | Password | Role |
|----------|----------|------|
| admin | password | Admin |
| submitter | password | Submitter |
| approver | password | Approver |
| dataentry | password | Data Entry |
| dataapprover | password | Data Approver |
| verifier | password | Verifier |

## Usage

### For Submitters
1. Log in with submitter credentials
2. Navigate to "Submit Bills"
3. Fill out the bill form and upload a document
4. Submit for approval

### For Approvers
1. Log in with approver credentials
2. Navigate to "Approve Bills"
3. Review submitted bills
4. Approve or reject with reasons

### For Data Entry Staff
1. Log in with data entry credentials
2. Navigate to "Data Entry"
3. Select an approved bill
4. Enter detailed vendor information and line items
5. Save the data entry

### For Data Approvers
1. Log in with data approver credentials
2. Navigate to "Data Approval"
3. Review entered data against original bills
4. Approve or reject data entries

### For Verifiers
1. Log in with verifier credentials
2. Navigate to "Verification"
3. Perform final review of all information
4. Provide final approval or rejection

### For Admins
1. Log in with admin credentials
2. Access all workflow stages
3. Manage users and roles in "User Management"
4. Monitor system-wide activity

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── approve/           # Bill approval page
│   ├── dashboard/         # Main dashboard
│   ├── data-approval/     # Data entry approval page
│   ├── data-entry/        # Data entry page
│   ├── submit/            # Bill submission page
│   ├── users/             # User management page
│   ├── verification/      # Final verification page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home/login page
├── components/            # Reusable components
│   ├── LoginForm.tsx      # Authentication form
│   └── Navigation.tsx     # Main navigation
├── context/               # React Context providers
│   ├── AppContext.tsx     # Main application state
│   └── AuthContext.tsx    # Authentication context
└── types/                 # TypeScript type definitions
    └── index.ts           # Main types and enums
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New Workflow Stage**: Add new status to `BillStatus` enum and create corresponding page
2. **New User Role**: Add to `UserRole` enum and update access control functions
3. **New Fields**: Update TypeScript interfaces and form components

### Customization

The application is designed to be easily customizable:

- **Workflow States**: Modify the `BillStatus` enum in `src/types/index.ts`
- **User Roles**: Update the `UserRole` enum and access control functions
- **UI Styling**: Customize Tailwind CSS classes throughout the components
- **Data Structure**: Extend interfaces in `src/types/index.ts`

## Security Considerations

- All actions are logged in audit trails
- Role-based access control prevents unauthorized access
- Client-side validation with server-side patterns
- Secure file upload handling (implement server-side validation in production)

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Environment Variables

Create a `.env.local` file for environment-specific configuration:

```
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=your-database-connection
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Review the documentation in the `/docs` folder

---

Built with ❤️ using Next.js and TypeScript
