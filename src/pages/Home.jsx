import axios from 'axios';
import React, { useEffect, useState } from 'react';
import style from './Home.module.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function Home() {
    const [customers, setCustomers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [filterType, setFilterType] = useState('name');
    const [filterValue, setFilterValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [dailyTotals, setDailyTotals] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const customersResult = await axios.get('http://localhost:1000/customers');
                const transactionsResult = await axios.get('http://localhost:1000/transactions');

                setCustomers(customersResult.data);
                setTransactions(transactionsResult.data);
                setFilteredCustomers(customersResult.data);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const handleFilterChange = (type, value) => {
        if (type === 'name') {
            const filtered = customers.filter(customer =>
                customer.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCustomers(filtered);
        } else if (type === 'amount') {
            const amount = parseInt(value, 10);
            if (!isNaN(amount)) {
                const filtered = customers.filter(customer =>
                    transactions.some(transaction =>
                        transaction.customer_id == customer.id && transaction.amount === amount
                    )
                );
                setFilteredCustomers(filtered);
            } else {
                setFilteredCustomers(customers);
            }
        }
    };

    useEffect(() => {
        handleFilterChange(filterType, filterValue);
    }, [filterType, filterValue]);

    useEffect(() => {
        if (selectedCustomer) {
            const customerTransactions = transactions.filter(
                transaction => transaction.customer_id == selectedCustomer.id
            );

            const dailyTotalsMap = customerTransactions.reduce((acc, transaction) => {
                const date = transaction.date.split('T')[0]; // Assuming date is in ISO format
                if (!acc[date]) {
                    acc[date] = 0;
                }
                acc[date] += transaction.amount;
                return acc;
            }, {});

            const dailyTotalsArray = Object.keys(dailyTotalsMap).map(date => ({
                date,
                total: dailyTotalsMap[date]
            }));

            setDailyTotals(dailyTotalsArray);
        }
    }, [selectedCustomer, transactions]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={style.main}>
            <div className="d">
                <div className={style.filterDiv}>
                    <label>
                        <span style={{ padding: "10px" }}>Filter by:</span>
                        <select name="filterType" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="name">Customer Name</option>
                            <option value="amount">Transaction Amount</option>
                        </select>
                    </label>
                    <input
                        type="text"
                        name="filterValue"
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        placeholder={`Enter ${filterType === 'name' ? 'customer name' : 'transaction amount'}`}
                    />
                </div>
                <br />
                <table border='3px' cellPadding='10px'>
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Transactions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(customer => (
                            <tr key={customer.id} onClick={() => setSelectedCustomer(customer)}>
                                <td className={style.link}>{customer.name}</td>
                                <td>
                                    <ul>
                                        {transactions
                                            .filter(transaction => transaction.customer_id == customer.id)
                                            .map(transaction => (
                                                <li key={transaction.id} style={{ margin: "8px 0" }}>
                                                    Date: {transaction.date}, Amount: {transaction.amount}
                                                </li>
                                            ))}
                                    </ul>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedCustomer && dailyTotals.length > 0 && (
                <div>
                    <h2>Daily Transaction Totals for {selectedCustomer.name}</h2>
                    <LineChart width={800} height={300} data={dailyTotals}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" padding={{ left: 30, right: 30 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                </div>
            )}
        </div>
    );
}
