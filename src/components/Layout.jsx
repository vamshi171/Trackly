import Sidebar from "./Sidebar";

export default function Layout({ children }) {

    return (
        <div className="layout-container">

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="layout-content">

                {/* Header */}
                <div className="layout-header">
                    <h2>Expense Tracker</h2>
                </div>

                {/* Page Content */}
                <div className="layout-body">
                    {children}
                </div>

            </div>
        </div>
    );
}