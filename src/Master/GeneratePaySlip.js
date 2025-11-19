import React, {useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import BackButton from "../component/BackButton";
import Sidebar from "../component/Sidebar"; // Import your sidebar component
import { useLocation,useNavigate } from "react-router-dom";

const GeneratePaySlip = () => {
 const [earningDetails, setEarningDetails] = useState([{ headName: "", headType: "", value: "" }]);
  const [deductionDetails, setDeductionDetails] = useState([{ headName: "", headType: "", value: "" }]);
  const [allHeads, setAllHeads] = useState([]);
  const location = useLocation();
  const selectedEmployee = location.state?.selectedEmployee;

  // Prefill month & year from location.state if available
  const monthYear = location.state?.monthYear || "";
  const monthFromList = location.state?.month || "";
  const yearFromList = location.state?.year || "";

  const [month, setMonth] = useState(monthFromList);
  const [year, setYear] = useState(yearFromList);
   const navigate = useNavigate();

useEffect(() => {
  const fetchHeads = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/salary-heads/salary-list");

      // Ensure the response is an array
      if (Array.isArray(res.data)) {
        setAllHeads(res.data);
      } else if (Array.isArray(res.data.data)) {
        // if your API wraps data inside { data: [...] }
        setAllHeads(res.data.data);
      } else {
        console.error("Salary heads API returned invalid format:", res.data);
        toast.error("Invalid salary heads data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch salary heads");
    }
  };
  fetchHeads();
}, []);

// Filter safely
const earningHeads = Array.isArray(allHeads) ? allHeads.filter(head => head.headId.startsWith("EARN")) : [];
const deductionHeads = Array.isArray(allHeads) ? allHeads.filter(head => head.headId.startsWith("DEDUCT")) : [];


  if (!selectedEmployee) {
    return (
      <div className="p-4 text-red-600 font-bold">
        ❌ No employee selected! Go back and select an employee.
        <BackButton />
      </div>
    );
  }

  const addEarningRow = () => setEarningDetails([...earningDetails, { headName: "", headType: "", value: "" }]);
  const addDeductionRow = () => setDeductionDetails([...deductionDetails, { headName: "", headType: "", value: "" }]);

  const calculateTotal = (arr) => arr.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const grossSalary = calculateTotal(earningDetails);
  const totalDeduction = calculateTotal(deductionDetails);
  const netSalary = grossSalary - totalDeduction;

const handleSave = async () => {
  if (!month || !year) {
    toast.error("Please select month & year");
    return;
  }

  const fullName = `${selectedEmployee.salutation} ${selectedEmployee.firstName} ${selectedEmployee.middleName} ${selectedEmployee.lastName}`.trim();

  // Map frontend value fields to match Mongoose schema (amount)
  const earningsPayload = earningDetails.map(e => ({
    headName: e.headName,
    amount: Number(e.value) || 0,
  }));

  const deductionsPayload = deductionDetails.map(d => ({
    headName: d.headName,
    amount: Number(d.value) || 0,
  }));

  const payload = {
    employeeId: selectedEmployee.employeeID, // match model field
    employeeName: fullName,
    month,
    year,
    earnings: earningsPayload,
    deductions: deductionsPayload,
    grossSalary,
    totalDeduction,
    netSalary,
  };

  try {
    await axios.post("http://localhost:5001/api/payslips", payload);
    toast.success("Payslip Generated Successfully!");
     navigate('/PaySlipGenerateEmployeeList', { replace: true });
  } catch (err) {
    console.error(err);
    toast.error("Error generating payslip");
  }
};


  
  // Add this at the top of GeneratePaySlip.js
const TwoColRow = ({ label1, value1, label2, value2 }) => {
  return (
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
};


  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ---------- Sidebar ---------- */}
      <Sidebar />

      {/* ---------- Main Content ---------- */}
      <div className="flex-1 p-4">
        {/* Header */}
        <div className="bg-blue-50 border w-full border-blue-300 rounded-lg shadow-md p-2 mb-4 
            flex justify-between items-center">
                <h2 className="text-xl font-bold text-blue-800 whitespace-nowrap">
                    Generate Pay Slip
                </h2>
                <div className="ml-auto">
                    <BackButton />
                </div>
            </div>

                {/* Employee Details */}
                <div className="bg-yellow-100 p-3 rounded shadow mb-4">
                <TwoColRow
                    label1="Employee Name"
                    value1={`${selectedEmployee.salutation} ${selectedEmployee.firstName} ${selectedEmployee.middleName} ${selectedEmployee.lastName}`}
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
        {/* ---------- PAY STRUCTURE ---------- */}
        <div className="bg-white min-h-screen shadow-lg rounded-lg p-4 w-full">
          <h3 className="text-xl font-semibold text-sky-600 col-span-full mb-4">PAY STRUCTURE</h3>

          {/* ===== EARNING TABLE ===== */}
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
                    onChange={(e) => {
                      const updated = [...earningDetails];
                      updated[index].headName = e.target.value;
                      setEarningDetails(updated);
                    }}
                    className="w-full pl-2 pr-1 border border-gray-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150 uppercase"
                  >
                    <option value="">SELECT</option>
                    {earningHeads.map(head => (
                      <option key={head._id} value={head.headName}>{head.headName}</option>
                    ))}
                  </select>
                </td>

                  <td className="border p-2">
                    <select
                      value={row.headType}
                      onChange={(e) => {
                        const updated = [...earningDetails];
                        updated[index].headType = e.target.value.toUpperCase();
                        setEarningDetails(updated);
                      }}
                      className="w-full pl-2 pr-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150 uppercase"
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
                    <button
                      type="button"
                      onClick={addEarningRow}
                      className="bg-green-500 hover:bg-green-600 text-white px-2 rounded mr-1"
                    >
                      +
                    </button>
                    {earningDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setEarningDetails(earningDetails.filter((_, i) => i !== index))
                        }
                        className="bg-red-500 hover:bg-red-600 text-white px-2 rounded"
                      >
                        -
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ===== DEDUCTION TABLE ===== */}
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
                    onChange={(e) => {
                      const updated = [...deductionDetails];
                      updated[index].headName = e.target.value;
                      setDeductionDetails(updated);
                    }}
                  className="w-full pl-2 pr-1 border border-gray-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150 uppercase"
                  >
                    <option value="">SELECT</option>
                    {deductionHeads.map(head => (
                      <option key={head._id} value={head.headName}>{head.headName}</option>
                    ))}
                  </select>
                </td>


                  <td className="border p-2">
                    <select
                      value={row.headType}
                      onChange={(e) => {
                        const updated = [...deductionDetails];
                        updated[index].headType = e.target.value.toUpperCase();
                        setDeductionDetails(updated);
                      }}
                     className="w-full pl-2 pr-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition-all duration-150 uppercase"
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
                    <button
                      type="button"
                      onClick={addDeductionRow}
                      className="bg-green-500 hover:bg-green-600 text-white px-2 rounded mr-1"
                    >
                      +
                    </button>
                    {deductionDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeductionDetails(deductionDetails.filter((_, i) => i !== index))
                        }
                        className="bg-red-500 hover:bg-red-600 text-white px-2 rounded"
                      >
                        -
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Summary */}
          <div className="bg-blue-100 p-4 rounded shadow mb-4">
            <p><b>Gross Salary:</b> ₹{grossSalary}</p>
            <p><b>Total Deduction:</b> ₹{totalDeduction}</p>
            <p><b>Net Salary:</b> ₹{netSalary}</p>
          </div>

          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded w-full"
          >
            Save & Generate Pay Slip
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratePaySlip;
