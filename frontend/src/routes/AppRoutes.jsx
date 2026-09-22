import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/Login/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";

import AddProduction from "../pages/Production/AddProduction";
import ProductionList from "../pages/Production/ProductionList";
import EditProduction from "../pages/Production/EditProduction";

import MachinesPage from "../pages/Machines/MachinesPage";
import OperatorsPage from "../pages/Operators/OperatorsPage";
import ComponentsPage from "../pages/Components/ComponentsPage";
import RejectionReasonPage from "../pages/RejectionReason/RejectionReasonPage";

import ReportsPage from "../pages/Reports/ReportsPage";
import ReportDetails from "../pages/Reports/ReportDetails";

import ChallanList from "../pages/Challans/ChallanList";
import CreateChallan from "../pages/Challans/CreateChallan";
import ChallanDetails from "../pages/Challans/ChallanDetails";

import UsersPage from "../pages/Users/UsersPage";

import ProtectedRoute from "../components/ProtectedRoute";

// New Pages
import PDIRPage from "../pages/PDIR/PDIRPage";
import GageManagementPage from "../pages/GageManagement/GageManagementPage";
import NotificationsPage from "../pages/Notifications/NotificationsPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Any Logged-in User */}
        <Route element={<ProtectedRoute />}>
          <Route path="/production/add" element={<AddProduction />} />
        </Route>

        {/* Admin Only */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Production */}
          <Route path="/production" element={<ProductionList />} />
          <Route path="/production/edit/:id" element={<EditProduction />} />

          {/* Reports */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:id" element={<ReportDetails />} />

          {/* Quality Modules */}
          <Route path="/pdir" element={<PDIRPage />} />
          <Route
            path="/gage-management"
            element={<GageManagementPage />}
          />

          {/* Notifications */}
          <Route
            path="/notifications"
            element={<NotificationsPage />}
          />

          {/* Challans */}
          <Route path="/challans" element={<ChallanList />} />
          <Route path="/challans/create" element={<CreateChallan />} />
          <Route path="/challans/:id" element={<ChallanDetails />} />

          {/* Masters */}
          <Route path="/machines" element={<MachinesPage />} />
          <Route path="/operators" element={<OperatorsPage />} />
          <Route path="/components" element={<ComponentsPage />} />
          <Route
            path="/rejection-reasons"
            element={<RejectionReasonPage />}
          />
          <Route path="/users" element={<UsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}