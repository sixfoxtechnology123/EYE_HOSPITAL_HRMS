import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import toast from "react-hot-toast";
import BackButton from "../component/BackButton";

const PaySlipGenerateEmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
  return localStorage.getItem("selectedMonth") || "";
});
const [selectedYear, setSelectedYear] = useState(() => {
  return localStorage.getItem("selectedYear") || "";
});

  const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/employees");
        setEmployees(res.data);
      } catch (err) {
        console.error("Fetch Employee Error:", err);
        toast.error("Failed to fetch employee list");
      }
    };
    fetchEmployees();
  }, []);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-3">
        <div className="bg-white shadow-md rounded-md p-3">

          {/* Header with Month Picker */}
          <div className="bg-blue-50 border w-full border-blue-300 rounded-lg shadow-md p-2 mb-4 
            flex flex-col md:flex-row items-center justify-between gap-2">

            <h2 className="text-xl font-bold text-blue-800 whitespace-nowrap">
              Generate Pay Slip – Employee List
            </h2>

            {/* Month-Year Calendar Picker */}
            <div className="flex gap-2 items-center rounded">
            <input
                type="month"
                className="border-1 border-gray-600 py-0 pl-2 rounded"
                value={selectedMonth}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedMonth(value);
                  localStorage.setItem("selectedMonth", value); // save month
                  if (value) {
                    const [year, month] = value.split("-");
                    setSelectedYear(year);
                    localStorage.setItem("selectedYear", year); // save year
                  }
                }}
              />
            </div>
            <div className="ml-auto">
              <BackButton />
            </div>
          </div>

          {/* Employee Table */}
          <table className="w-full table-auto border border-blue-500 text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-blue-500 px-2 py-1">S.No</th>
                <th className="border border-blue-500 px-2 py-1">Employee ID</th>
                <th className="border border-blue-500 px-2 py-1">Employee Name</th>
                <th className="border border-blue-500 px-2 py-1">Mobile No</th>
                <th className="border border-blue-500 px-2 py-1">Email</th>
                <th className="border border-blue-500 px-2 py-1">Action</th>
              </tr>
            </thead>

            <tbody className="text-center">
              {employees && employees.length > 0 ? (
                employees.map((emp, index) => (
                  <tr key={emp._id} className="hover:bg-gray-100 transition">
                    <td className="border border-blue-500 px-2 py-1">{index + 1}</td>
                    <td className="border border-blue-500 px-2 py-1">{emp.employeeID || "-"}</td>
                    <td className="border border-blue-500 px-2 py-1">
                      {`${emp.salutation || ""} ${emp.firstName || ""} ${emp.lastName || ""}`}
                    </td>
                    <td className="border border-blue-500 px-2 py-1">{emp.permanentAddress?.mobile || "-"}</td>
                    <td className="border border-blue-500 px-2 py-1">{emp.permanentAddress?.email || "-"}</td>

                    <td className="border border-blue-500 px-2 py-1">
                      <button
                     onClick={() =>
                  navigate("/GeneratePaySlip", {
                      state: {
                        selectedEmployee: emp,
                       month: selectedMonth ? monthNames[Number(selectedMonth.split("-")[1]) - 1] : "",
                        year: selectedMonth ? selectedMonth.split("-")[0] : ""

                      }
                    })

                      }

                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Generate Pay Slip
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
};

export default PaySlipGenerateEmployeeList;
