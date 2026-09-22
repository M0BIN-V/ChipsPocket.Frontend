import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { authStorage } from '../api/authStorage'
import { AuthLandingPage } from '../features/auth/AuthLandingPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { HomePage } from '../features/tables/HomePage'
import { CreateTablePage } from '../features/tables/CreateTablePage'
import { TablePage } from '../features/tables/TablePage'

function AuthenticatedRoute() {
    return authStorage.getAccessToken() ? <HomePage /> : <Navigate to="/login" replace />
}

function CreateTableRoute() {
    return authStorage.getAccessToken() ? <CreateTablePage /> : <Navigate to="/login" replace />
}

function TableRoute() {
    return authStorage.getAccessToken() ? <TablePage /> : <Navigate to="/login" replace />
}

function JoinRoute() {
        return authStorage.getAccessToken() ? <HomePage /> : <Navigate to="/login" replace />
}

function JoinedLobbyRoute() {
    return authStorage.getAccessToken() ? <TablePage /> : <Navigate to="/login" replace />
}

function GuestRoute({ children }: { children: ReactElement }) {
    return authStorage.getAccessToken() ? <Navigate to="/authenticated" replace /> : children
}

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<GuestRoute><AuthLandingPage /></GuestRoute>} />
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/authenticated" element={<AuthenticatedRoute />} />
            <Route path="/create-table" element={<CreateTableRoute />} />
            <Route path="/table/:tableId" element={<TableRoute />} />
            <Route path="/table/lobby" element={<JoinedLobbyRoute />} />
            <Route path="/join/:token" element={<JoinRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
