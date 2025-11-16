module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/types/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BillStatus",
    ()=>BillStatus,
    "UserRole",
    ()=>UserRole
]);
var UserRole = /*#__PURE__*/ function(UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["SUBMITTER"] = "submitter";
    UserRole["APPROVER"] = "approver";
    UserRole["DATA_ENTRY"] = "data_entry";
    UserRole["DATA_APPROVER"] = "data_approver";
    UserRole["VERIFIER"] = "verifier";
    return UserRole;
}({});
var BillStatus = /*#__PURE__*/ function(BillStatus) {
    BillStatus["DRAFT"] = "draft";
    BillStatus["SUBMITTED"] = "submitted";
    BillStatus["APPROVED"] = "approved";
    BillStatus["REJECTED"] = "rejected";
    BillStatus["DATA_ENTRY_PENDING"] = "data_entry_pending";
    BillStatus["DATA_ENTRY_COMPLETED"] = "data_entry_completed";
    BillStatus["DATA_APPROVED"] = "data_approved";
    BillStatus["DATA_REJECTED"] = "data_rejected";
    BillStatus["VERIFIED"] = "verified";
    BillStatus["FINAL_APPROVED"] = "final_approved";
    BillStatus["FINAL_REJECTED"] = "final_rejected";
    return BillStatus;
}({});
}),
"[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/index.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const initialState = {
    user: null,
    isAuthenticated: false
};
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function authReducer(state, action) {
    switch(action.type){
        case 'LOGIN_SUCCESS':
            return {
                user: action.payload,
                isAuthenticated: true
            };
        case 'LOGOUT':
            return {
                user: null,
                isAuthenticated: false
            };
        default:
            return state;
    }
}
// Mock users for demonstration
const MOCK_USERS = [
    {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@company.com',
        roles: [
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].ADMIN
        ],
        createdAt: new Date(),
        createdBy: 'system'
    },
    {
        id: 'submitter-1',
        username: 'submitter',
        email: 'submitter@company.com',
        roles: [
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].SUBMITTER
        ],
        createdAt: new Date(),
        createdBy: 'admin-1'
    },
    {
        id: 'approver-1',
        username: 'approver',
        email: 'approver@company.com',
        roles: [
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].APPROVER
        ],
        createdAt: new Date(),
        createdBy: 'admin-1'
    },
    {
        id: 'dataentry-1',
        username: 'dataentry',
        email: 'dataentry@company.com',
        roles: [
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].DATA_ENTRY
        ],
        createdAt: new Date(),
        createdBy: 'admin-1'
    },
    {
        id: 'dataapprover-1',
        username: 'dataapprover',
        email: 'dataapprover@company.com',
        roles: [
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].DATA_APPROVER
        ],
        createdAt: new Date(),
        createdBy: 'admin-1'
    },
    {
        id: 'verifier-1',
        username: 'verifier',
        email: 'verifier@company.com',
        roles: [
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].VERIFIER
        ],
        createdAt: new Date(),
        createdBy: 'admin-1'
    }
];
function AuthProvider({ children }) {
    const [state, dispatch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReducer"])(authReducer, initialState);
    const login = async (username, password)=>{
        // Simple mock authentication - in a real app, this would call an API
        const user = MOCK_USERS.find((u)=>u.username === username);
        if (user && password === 'password') {
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: user
            });
            localStorage.setItem('user', JSON.stringify(user));
            return true;
        }
        return false;
    };
    const logout = ()=>{
        dispatch({
            type: 'LOGOUT'
        });
        localStorage.removeItem('user');
    };
    // Check for existing session on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: user
                });
            } catch (error) {
                localStorage.removeItem('user');
            }
        }
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            login,
            logout
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AuthContext.tsx",
        lineNumber: 132,
        columnNumber: 5
    }, this);
}
function useAuth() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
}),
"[project]/src/context/AppContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppProvider",
    ()=>AppProvider,
    "canAccessBill",
    ()=>canAccessBill,
    "createAuditEntry",
    ()=>createAuditEntry,
    "getNextStatus",
    ()=>getNextStatus,
    "hasAnyRole",
    ()=>hasAnyRole,
    "hasRole",
    ()=>hasRole,
    "useApp",
    ()=>useApp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/index.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const initialState = {
    users: [],
    bills: [],
    currentUser: null
};
const AppContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function appReducer(state, action) {
    switch(action.type){
        case 'SET_CURRENT_USER':
            return {
                ...state,
                currentUser: action.payload
            };
        case 'ADD_USER':
            return {
                ...state,
                users: [
                    ...state.users,
                    action.payload
                ]
            };
        case 'UPDATE_USER':
            return {
                ...state,
                users: state.users.map((user)=>user.id === action.payload.id ? action.payload : user)
            };
        case 'DELETE_USER':
            return {
                ...state,
                users: state.users.filter((user)=>user.id !== action.payload)
            };
        case 'ADD_BILL':
            return {
                ...state,
                bills: [
                    ...state.bills,
                    action.payload
                ]
            };
        case 'UPDATE_BILL':
            return {
                ...state,
                bills: state.bills.map((bill)=>bill.id === action.payload.id ? action.payload : bill)
            };
        case 'DELETE_BILL':
            return {
                ...state,
                bills: state.bills.filter((bill)=>bill.id !== action.payload)
            };
        case 'LOAD_INITIAL_DATA':
            return {
                ...state,
                users: action.payload.users,
                bills: action.payload.bills
            };
        default:
            return state;
    }
}
function AppProvider({ children }) {
    const [state, dispatch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReducer"])(appReducer, initialState);
    // Initialize with sample data
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useEffect(()=>{
        const sampleUsers = [
            {
                id: 'admin-1',
                username: 'admin',
                email: 'admin@company.com',
                roles: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].ADMIN
                ],
                createdAt: new Date(),
                createdBy: 'system'
            },
            {
                id: 'submitter-1',
                username: 'submitter',
                email: 'submitter@company.com',
                roles: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].SUBMITTER
                ],
                createdAt: new Date(),
                createdBy: 'admin-1'
            },
            {
                id: 'approver-1',
                username: 'approver',
                email: 'approver@company.com',
                roles: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].APPROVER
                ],
                createdAt: new Date(),
                createdBy: 'admin-1'
            },
            {
                id: 'dataentry-1',
                username: 'dataentry',
                email: 'dataentry@company.com',
                roles: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].DATA_ENTRY
                ],
                createdAt: new Date(),
                createdBy: 'admin-1'
            },
            {
                id: 'dataapprover-1',
                username: 'dataapprover',
                email: 'dataapprover@company.com',
                roles: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].DATA_APPROVER
                ],
                createdAt: new Date(),
                createdBy: 'admin-1'
            },
            {
                id: 'verifier-1',
                username: 'verifier',
                email: 'verifier@company.com',
                roles: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].VERIFIER
                ],
                createdAt: new Date(),
                createdBy: 'admin-1'
            }
        ];
        const sampleBills = [
            {
                id: 'bill-1',
                title: 'Office Supplies Purchase',
                description: 'Monthly office supplies including paper, pens, and stationery',
                amount: 450.00,
                fileName: 'office-supplies-invoice.pdf',
                fileUrl: '/sample/office-supplies-invoice.pdf',
                status: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].SUBMITTED,
                submittedBy: 'submitter-1',
                submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                auditTrail: [
                    {
                        id: 'audit-1',
                        action: 'Bill Submitted',
                        performedBy: 'submitter-1',
                        performedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        details: 'Bill "Office Supplies Purchase" submitted for approval',
                        newStatus: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].SUBMITTED
                    }
                ]
            },
            {
                id: 'bill-2',
                title: 'Software License Renewal',
                description: 'Annual renewal for productivity software licenses',
                amount: 1200.00,
                fileName: 'software-license-invoice.pdf',
                fileUrl: '/sample/software-license-invoice.pdf',
                status: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].APPROVED,
                submittedBy: 'submitter-1',
                submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                auditTrail: [
                    {
                        id: 'audit-2',
                        action: 'Bill Submitted',
                        performedBy: 'submitter-1',
                        performedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                        details: 'Bill "Software License Renewal" submitted for approval',
                        newStatus: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].SUBMITTED
                    },
                    {
                        id: 'audit-3',
                        action: 'Bill Approved',
                        performedBy: 'approver-1',
                        performedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                        details: 'Bill approved by approver',
                        previousStatus: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].SUBMITTED,
                        newStatus: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].APPROVED
                    }
                ]
            }
        ];
        dispatch({
            type: 'LOAD_INITIAL_DATA',
            payload: {
                users: sampleUsers,
                bills: sampleBills
            }
        });
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AppContext.Provider, {
        value: {
            state,
            dispatch
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AppContext.tsx",
        lineNumber: 186,
        columnNumber: 5
    }, this);
}
function useApp() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
function hasRole(user, role) {
    return user?.roles.includes(role) ?? false;
}
function hasAnyRole(user, roles) {
    return user?.roles.some((userRole)=>roles.includes(userRole)) ?? false;
}
function canAccessBill(user, bill) {
    if (!user) return false;
    // Admin can access everything
    if (hasRole(user, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].ADMIN)) return true;
    // Users can access bills they submitted
    if (bill.submittedBy === user.id) return true;
    // Role-based access based on bill status
    switch(bill.status){
        case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].SUBMITTED:
            return hasRole(user, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].APPROVER);
        case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].APPROVED:
        case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].DATA_ENTRY_PENDING:
            return hasRole(user, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].DATA_ENTRY);
        case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].DATA_ENTRY_COMPLETED:
            return hasRole(user, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].DATA_APPROVER);
        case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].DATA_APPROVED:
            return hasRole(user, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UserRole"].VERIFIER);
        default:
            return false;
    }
}
function getNextStatus(currentStatus, action) {
    if (action === 'reject') {
        switch(currentStatus){
            case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].SUBMITTED:
                return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].REJECTED;
            case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].DATA_ENTRY_COMPLETED:
                return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].DATA_REJECTED;
            case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].DATA_APPROVED:
                return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].FINAL_REJECTED;
            default:
                return currentStatus;
        }
    }
    switch(currentStatus){
        case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].SUBMITTED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].APPROVED;
        case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].APPROVED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].DATA_ENTRY_PENDING;
        case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].DATA_ENTRY_COMPLETED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].DATA_APPROVED;
        case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].DATA_APPROVED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].VERIFIED;
        case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].VERIFIED:
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BillStatus"].FINAL_APPROVED;
        default:
            return currentStatus;
    }
}
function createAuditEntry(action, performedBy, details, previousStatus, newStatus) {
    return {
        id: Math.random().toString(36).substr(2, 9),
        action,
        performedBy,
        performedAt: new Date(),
        details,
        previousStatus,
        newStatus
    };
}
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__adc9861a._.js.map