# CRM Bill Management System

## Setup Instructions

### Run Backend
```bash
cd C:\Sudhansu\repos\crm\crm-backend; npm start
```
<!-- Alternative command: npx ts-node --transpile-only src/app.ts -->

### Run Frontend
```bash
cd C:\Sudhansu\repos\crm\crm-app; npm run dev
```

## Recent Updates

### GST Number Extraction
- Implemented automatic GST number extraction from uploaded bill documents
- Enhanced OCR service to specifically target GST numbers instead of full text extraction
- Added visual feedback for GST extraction status in the submit form

### Bug Fixes
- Fixed user roles validation issue in Navigation component
- Added defensive programming for user object validation
- Enhanced error handling for malformed user data from localStorage

## System Features
- Bill submission with automatic GST number extraction
- Multi-level approval workflow
- Role-based access control
- Document management with OCR capabilities
- Audit trail tracking
- Real-time status updates