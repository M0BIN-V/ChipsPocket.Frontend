import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import type { ReactElement } from 'react'
import { authStorage } from '../api/authStorage'
import { AuthLandingPage } from '../features/auth/AuthLandingPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { HomePage } from '../features/tables/HomePage'
import { CreateTablePage } from '../features/tables/CreateTablePage'
import { JoinTablePage } from '../features/tables/JoinTablePage'
import { TablePage } from '../features/tables/TablePage'
import { ActiveHandPage } from '../features/tables/ActiveHandPage'

function AuthenticatedRoute() {
    return authStorage.getAccessToken() ? <HomePage /> : <Navigate to="/login" replace />
}

function CreateTableRoute() {
    return authStorage.getAccessToken() ? <CreateTablePage /> : <Navigate to="/login" replace />
}

function TableRoute() {
    return authStorage.getAccessToken() ? <TablePage /> : <Navigate to="/login" replace />
}

function ActiveHandRoute() {
    return authStorage.getAccessToken() ? <ActiveHandPage /> : <Navigate to="/login" replace />
}

function JoinRoute() {
    return authStorage.getAccessToken() ? <JoinTablePage /> : <Navigate to="/login" replace />
}

function TableAliasRoute() {
    const { tableId } = useParams()
    return <Navigate to={`/tables/${encodeURIComponent(tableId ?? '')}`} replace />
}

function JoinedLobbyRoute() {
    return authStorage.getAccessToken() ? <TablePage /> : <Navigate to="/login" replace />
}

function GuestRoute({ children }: { children: ReactElement }) {
    return authStorage.getAccessToken() ? <Navigate to="/" replace /> : children
}

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<AuthenticatedRoute />} />
            <Route path="/welcome" element={<GuestRoute><AuthLandingPage /></GuestRoute>} />
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/create-table" element={<CreateTableRoute />} />
            <Route path="/join" element={<JoinRoute />} />
            <Route path="/join/:token" element={<JoinRoute />} />
            <Route path="/tables/:tableId" element={<TableRoute />} />
            <Route path="/tables/:tableId/hands/:handId" element={<ActiveHandRoute />} />
            <Route path="/table/:tableId" element={<TableAliasRoute />} />
            <Route path="/table/lobby" element={<JoinedLobbyRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
