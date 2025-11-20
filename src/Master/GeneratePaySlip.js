import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import BackButton from "../component/BackButton";
import Sidebar from "../component/Sidebar"; 
import { useLocation, useNavigate } from "react-router-dom";

const GeneratePaySlip = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if editing
  const editingData = location.state?.editingData || null;

  // Prepare selectedEmployee from editingData or passed state
  const selectedEmployee = editingData
    ? {
        employeeID: editingData.employeeId,
        salutation: "", 
        firstName: editingData.employeeName,
        permanentAddress: {
          mobile: editingData.mobile,
          email: editingData.email
        }
      }
    : location.state?.selectedEmployee || null;

  // Month & year
  const [month, setMonth] = useState(editingData?.month || location.state?.month || "");
  const [year, setYear] = useState(editingData?.year || location.state?.year || "");

  const [allHeads, setAllHeads] = useState([]);
  
  const [earningDetails, setEarningDetails] = useState(
    editingData?.earnings.map(e => ({
      headName: e.headName,
      headType: e.headType || "FIXED",
      value: e.amount || 0
    })) || [{ headName: "", headType: "FIXED", value: 0 }]
  );

  const [deductionDetails, setDeductionDetails] = useState(
    editingData?.deductions.map(d => ({
      headName: d.headName,
      headType: d.headType || "FIXED",
      value: d.amount || 0
    })) || [{ headName: "", headType: "FIXED", value: 0 }]
  );

  const [monthDays, setMonthDays] = useState(editingData?.monthDays || "");
  const [totalWorkingDays, setTotalWorkingDays] = useState(editingData?.totalWorkingDays || "");
  const [LOP, setLOP] = useState(editingData?.LOP || "");
  const [leaves, setLeaves] = useState(editingData?.leaves || "");

// Helper to get total days in a month
const getDaysInMonth = (monthName, year) => {
  if (!monthName || !year) return 0;
  const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth(); // Jan = 0
  return new Date(year, monthIndex + 1, 0).getDate(); // Last day of month
};

useEffect(() => {
  if (month && year) {
    const days = getDaysInMonth(month, year);
    setMonthDays(days);
  }
}, [month, year]);

  useEffect(() => {
    const fetchEmployeeSalary = async () => {
      if (!selectedEmployee?.employeeID || editingData) return;

      try {
        // Fetch latest payslip for this employee (with month/year)
        const res = await axios.get(
          `http://localhost:5001/api/payslips/employee/${selectedEmployee.employeeID}?month=${month}&year=${year}`
        );

        if (res.data.success && res.data.data) {
          const latestPayslip = res.data.data;

          setEarningDetails(
            latestPayslip.earnings?.map(e => ({
              headName: e.headName || "",
              headType: e.headType || "FIXED",
              value: e.value || 0
            })) || [{ headName: "", headType: "", value: "" }]
          );

          setDeductionDetails(
            latestPayslip.deductions?.map(d => ({
              headName: d.headName || "",
              headType: d.headType || "FIXED",
              value: d.value || 0
            })) || [{ headName: "", headType: "", value: "" }]
          );

        } else {
          setEarningDetails([{ headName: "", headType: "", value: "" }]);
          setDeductionDetails([{ headName: "", headType: "", value: "" }]);
        }

      } catch (err) {
        console.error("Error fetching payslip:", err);
        toast.error("Failed to fetch earnings and deductions");
      }
    };

    fetchEmployeeSalary();
  }, [selectedEmployee, editingData, month, year]);

  const earningHeads = Array.isArray(allHeads) ? allHeads.filter(h => h.headId.startsWith("EARN")) : [];
  const deductionHeads = Array.isArray(allHeads) ? allHeads.filter(h => h.headId.startsWith("DEDUCT")) : [];

  if (!selectedEmployee) {
    return (
      <div className="p-4 text-red-600 font-bold">
        ❌ No employee selected! Go back and select an employee.
        <BackButton />
      </div>
    );
  }

  const addEarningRow = () => setEarningDetails([...earningDetails, { headName: "", headType: "FIXED", value: 0 }]);
  const addDeductionRow = () => setDeductionDetails([...deductionDetails, { headName: "", headType: "FIXED", value: 0 }]);

  const calculateTotal = (arr) => arr.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const grossSalary = calculateTotal(earningDetails);
  const totalDeduction = calculateTotal(deductionDetails);
  const netSalary = grossSalary - totalDeduction;
  const md = Number(monthDays) || 0;
  const lopDays = Number(LOP) || 0;
  // LOP Amount = (Gross Salary / Total Calendar Days) * LOP Days
  const lopAmount = md > 0 ? (grossSalary / md) * lopDays : 0;
  // in-hand salary = netSalary - lopAmount
  const inHandSalary = netSalary - lopAmount;


  const handleSave = async () => {
    if (!month || !year) {
      toast.error("Please select month & year");
      return;
    }

    const fullName = `${selectedEmployee.salutation} ${selectedEmployee.firstName}`.trim();

    const earningsPayload = earningDetails.map(e => ({
      headName: e.headName,
      type: e.headType || "FIXED",
      amount: Number(e.value) || 0
    }));

    const deductionsPayload = deductionDetails.map(d => ({
      headName: d.headName,
      type: d.headType || "FIXED",
      amount: Number(d.value) || 0
    }));

    const payload = {
      employeeId: selectedEmployee.employeeID,
      employeeName: fullName,
      mobile: selectedEmployee.permanentAddress?.mobile || "",
      email: selectedEmployee.permanentAddress?.email || "",
      month,
      year,
      earnings: earningsPayload,
      deductions: deductionsPayload,
      grossSalary: Number(grossSalary.toFixed(2)),
      totalDeduction: Number(totalDeduction.toFixed(2)),
      netSalary: Number(netSalary.toFixed(2)),
      lopAmount: Number(lopAmount.toFixed(2)),
      inHandSalary: Number(inHandSalary.toFixed(2)),
      monthDays,         // new
      totalWorkingDays,  // new
      LOP,          
      leaves,
    };

    try {
      if (editingData?._id) {
        await axios.put(`http://localhost:5001/api/payslips/${editingData._id}`, payload);
        toast.success("Payslip Updated Successfully!");
         
      } else {
        await axios.post("http://localhost:5001/api/payslips", payload);
        toast.success("Payslip Generated Successfully!");
      }
      //navigate("/PaySlipGenerateEmployeeList");
    } catch (err) {
      console.error(err);
      toast.error("Error saving payslip");
    }
  };

  const TwoColRow = ({ label1, value1, label2, value2 }) => (
    <div className="flex text-sm mb-1">
      <div className="flex flex-1">
        <div className="min-w-[140px] font-semibold">{label1}</div>
        <div>: {value1 || "N/A"}</div>
      </div>
      {label2 && (
        <div className="flex flex-1">
          <div className="min-w-[80px] font-semibold">{label2}</div>
          <div>: {value2 || "N/A"}</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-4">
        <div className="bg-blue-50 border w-full border-blue-300 rounded-lg shadow-md p-2 mb-4 
            flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-800 whitespace-nowrap">
            Generate Pay Slip
          </h2>
          <div className="ml-auto">
            <BackButton />
          </div>
        </div>

        <div className="bg-yellow-100 p-3 rounded shadow mb-4">
          <TwoColRow
            label1="Employee Name"
            value1={`${selectedEmployee.salutation} ${selectedEmployee.firstName}`}
            label2="ID"
            value2={selectedEmployee.employeeID}
          />
          <TwoColRow
            label1="Mobile"
            value1={selectedEmployee.permanentAddress.mobile}
            label2="Email"
            value2={selectedEmployee.permanentAddress.email}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label>Month</label>
            <select
              className="border p-1 rounded font-semibold w-full cursor-not-allowed"
              value={month}
              disabled
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">Select</option>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Year</label>
            <input
              type="number"
              className="border p-1 rounded w-full cursor-not-allowed"
              value={year} 
              disabled
              onChange={(e) => setYear(e.target.value)}
              placeholder="2025"
            />
          </div>
        </div>

        {/* PAY STRUCTURE */}
        <div className="bg-white min-h-screen shadow-lg rounded-lg p-4 w-full">
          <h3 className="text-xl font-semibold text-sky-600 col-span-full mb-2">PAY STRUCTURE</h3>

          {/* EARNING TABLE */}
          <h4 className="text-lg font-semibold text-white mb-2 pl-2 bg-blue-700 rounded-sm">EARNING</h4>
          <table className="w-full border border-gray-300 mb-6 text-sm font-medium">
            <thead className="bg-sky-100">
              <tr>
                <th className="border p-2 w-16">SL.NO.</th>
                <th className="border p-2">HEAD NAME</th>
                <th className="border p-2">HEAD TYPE</th>
                <th className="border p-2">VALUE</th>
                <th className="border p-2 w-20 text-center">ACTION</th>
              </tr>
            </thead>
           <tbody>
              {earningDetails.map((row, index) => (
                <tr key={index} className="even:bg-gray-50">
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2">
                    <select
                      value={row.headName}
                      disabled
                      onChange={(e) => {
                        const updated = [...earningDetails];
                        updated[index].headName = e.target.value;
                        setEarningDetails(updated);
                      }}
                      className="w-full pl-2 pr-1 border border-gray-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150 uppercase cursor-not-allowed"
                    >
                      {row.headName && !earningHeads.find(h => h.headName === row.headName) && (
                        <option value={row.headName}>{row.headName}</option>
                      )}
                      <option value="">SELECT</option>
                      {earningHeads.map(head => (
                        <option key={head._id} value={head.headName}>{head.headName}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-2">
                    <select
                      value={row.headType}
                      disabled
                      onChange={(e) => {
                        const updated = [...earningDetails];
                        updated[index].headType = e.target.value.toUpperCase();
                        setEarningDetails(updated);
                      }}
                      className="w-full pl-2 pr-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150 uppercase cursor-not-allowed"
                    >
                      <option value="">SELECT</option>
                      <option value="FIXED">FIXED</option>
                      <option value="VARIABLE">VARIABLE</option>
                    </select>
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={row.value}
                      onChange={(e) => {
                        const updated = [...earningDetails];
                        updated[index].value = e.target.value;
                        setEarningDetails(updated);
                      }}
                      className="w-full pl-2 pr-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150"
                    />
                  </td>
                  <td className="border p-2 text-center">
                    <button type="button" onClick={addEarningRow} className="bg-green-500 hover:bg-green-600 text-white px-2 rounded mr-1">+</button>
                    {earningDetails.length > 1 && (
                      <button type="button" onClick={() => setEarningDetails(earningDetails.filter((_, i) => i !== index))} className="bg-red-500 hover:bg-red-600 text-white px-2 rounded">-</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* DEDUCTION TABLE */}
          <h4 className="text-lg font-semibold text-white mb-2 pl-2 bg-blue-700 rounded-sm">DEDUCTION</h4>
          <table className="w-full border border-gray-300 mb-6 text-sm font-medium">
            <thead className="bg-sky-100">
              <tr>
                <th className="border p-2 w-16">SL.NO.</th>
                <th className="border p-2">HEAD NAME</th>
                <th className="border p-2">HEAD TYPE</th>
                <th className="border p-2">VALUE</th>
                <th className="border p-2 w-20 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {deductionDetails.map((row, index) => (
                <tr key={index} className="even:bg-gray-50">
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2">
                    <select
                      value={row.headName}
                      disabled
                      onChange={(e) => {
                        const updated = [...deductionDetails];
                        updated[index].headName = e.target.value;
                        setDeductionDetails(updated);
                      }}
                      className="w-full pl-2 pr-1 border border-gray-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150 uppercase cursor-not-allowed"
                    >
                      {row.headName && !deductionHeads.find(h => h.headName === row.headName) && (
                        <option value={row.headName}>{row.headName}</option>
                      )}
                      <option value="">SELECT</option>
                      {deductionHeads.map(head => (
                        <option key={head._id} value={head.headName}>{head.headName}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-2">
                    <select
                      value={row.headType}
                      disabled
                      onChange={(e) => {
                        const updated = [...deductionDetails];
                        updated[index].headType = e.target.value.toUpperCase();
                        setDeductionDetails(updated);
                      }}
                      className="w-full pl-2 pr-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150 uppercase cursor-not-allowed"
                    >
                      <option value="">SELECT</option>
                      <option value="FIXED">FIXED</option>
                      <option value="VARIABLE">VARIABLE</option>
                    </select>
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={row.value}
                      onChange={(e) => {
                        const updated = [...deductionDetails];
                        updated[index].value = e.target.value;
                        setDeductionDetails(updated);
                      }}
                      className="w-full pl-2 pr-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150"
                    />
                  </td>
                  <td className="border p-2 text-center">
                    <button type="button" onClick={addDeductionRow} className="bg-green-500 hover:bg-green-600 text-white px-2 rounded mr-1">+</button>
                    {deductionDetails.length > 1 && (
                      <button type="button" onClick={() => setDeductionDetails(deductionDetails.filter((_, i) => i !== index))} className="bg-red-500 hover:bg-red-600 text-white px-2 rounded">-</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* ADDITIONAL FIELDS */}
              <h4 className="text-lg font-semibold text-white mb-2 pl-2 bg-blue-700 rounded-sm">ADDITIONAL INFO</h4>
              <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
                <div>
                  <label className="font-semibold">Month Days</label>
                 <input
                    type="number"
                    value={monthDays}
                    readOnly
                     className="font-semibold w-full pl-2 pr-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150 cursor-not-allowed"
                  />

                </div>
                <div>
                  <label className="font-semibold">Total Working Days</label>
                  <input
                    type="number"
                    value={totalWorkingDays}
                    onChange={(e) => setTotalWorkingDays(Number(e.target.value))}
                     className="font-semibold w-full pl-2 pr-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150"
                  />
                </div>
                <div>
                  <label className="font-semibold">LOP</label>
                  <input
                    type="number"
                    value={LOP}
                    onChange={(e) => setLOP(Number(e.target.value))}
                     className="font-semibold w-full pl-2 pr-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150"
                  />
                </div>
                <div>
                  <label className="font-semibold">Leaves</label>
                  <input
                    type="number"
                    value={leaves}
                    onChange={(e) => setLeaves(Number(e.target.value))}
                     className="font-semibold w-full pl-2 pr-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150"
                  />
                </div>
              </div>


          {/* Total Summary and Actions */}
          <div className="flex justify-between items-start mb-6">
            <div className="border-2 border-gray-400 rounded-lg p-4 w-80">
              <div className="flex justify-between mb-2">
                <span className="text-gray-950 font-semibold w-40">Gross Salary:</span>
                <span className="font-medium text-gray-800 text-right w-24">₹{grossSalary.toFixed(2)}</span>
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-gray-950 font-semibold w-40">Total Deduction:</span>
                <span className="font-medium text-gray-800 text-right w-24">₹{totalDeduction.toFixed(2)}</span>
              </div>

              <hr className="border-gray-500" />

              <div className="flex justify-between mb-2">
                <span className="text-gray-950 font-semibold w-40">Net Salary:</span>
                <span className="font-medium text-gray-800 text-right w-24">₹{netSalary.toFixed(2)}</span>
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-gray-950 font-semibold w-40">LOP Deduction:</span>
                <span className="font-medium text-gray-800 text-right w-24">₹{lopAmount.toFixed(2)}</span>
              </div>

              <hr className="border-gray-500" />

              <div className="flex justify-between mt-2 font-semibold text-gray-950">
                <span className="w-40">In-Hand Total Salary:</span>
                <span className="text-right w-24">₹{inHandSalary.toFixed(2)}</span>
              </div>
            </div>
            {/* Buttons */}
            <div className="flex gap-3 mt-20">
              <button
                onClick={handleSave}
                className={`px-4 py-1 rounded ${editingData ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-600 text-white"}`}
              >
                {editingData ? "Update" : "Submit"}
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1 rounded bg-green-500 hover:bg-green-600 text-white"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratePaySlip;
