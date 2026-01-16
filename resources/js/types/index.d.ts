export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface Role {
    id: string;
    name: UserRole;
    description?: string;
}

export interface Employee {
    id: string;
    employee_code: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    photo_path?: string;
    is_active: boolean;
    full_name?: string;
    subsidiaries?: Subsidiary[];
    services?: Service[];
}

export interface User {
    id: string;
    employee_id?: string;
    email: string;
    is_active: boolean;
    last_login_at?: string;
    employee?: Employee;
    roles: Role[];
}

export interface Company {
    id: string;
    name: string;
    photo_path?: string;
    is_active: boolean;
}

export interface Subsidiary {
    id: string;
    company_id?: string;
    code: string;
    name: string;
    photo_path?: string;
    is_active: boolean;
    company?: Company;
}

export interface Service {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
}

export type TimeEntryStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface TimeEntry {
    id: string;
    employee_id: string;
    subsidiary_id: string;
    service_id?: string;
    work_date: string;
    minutes: number;
    note?: string;
    requester?: string;
    status: TimeEntryStatus;
    submitted_at?: string;
    approved_at?: string;
    approved_by?: string;
    rejection_reason?: string;
    employee?: Employee;
    subsidiary?: Subsidiary;
    service?: Service;
    approver?: User;
}

export type AppView = 
    | 'dashboard' 
    | 'timesheet' 
    | 'validation' 
    | 'reports' 
    | 'subsidiaries' 
    | 'services'
    | 'employees' 
    | 'users'
    | 'profile';

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
