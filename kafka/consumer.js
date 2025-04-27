const kafka = require('../config/kafka');
const clients = require('../websocket');
async function startConsumer() {

    const consumer = kafka.consumer({ groupId: 'sync-hr-payroll-consumer' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['payroll-updated', 'hr-updated'], });

    await consumer.run({
        eachMessage: async ({ topic,message }) => {
            const data = JSON.parse(message.value.toString());
            switch (topic) {
                case 'payroll-updated':
                    await processPayrollData(data);
                    break;
                case 'hr-updated':
                    await processHRData(data);
                    break;
                default:
                    console.log(`Unhandled topic: ${topic}`);
                    break;
            }
        },
    });
}

async function processPayrollData(e) {
    console.log('Received payroll data:', e);
            const emp = {
          Employee_ID: e.idEmployee,
          Employee_Number: e.employeeNumber,
          Last_Name: e.lastName,
          First_Name: e.firstName,
          SSN: e.ssn,
          Pay_Rate: e.payRate,
          Pay_Rate_ID: e.payRatesId,
          Vacation_Days: e.vacationDays,
          Paid_To_Date: e.paidToDate,
          Paid_Last_Year: e.paidLastYear
        }

    const jsonMessage = { type: 'new_data', data: emp };
    const message = JSON.stringify(jsonMessage);
    clients.broadcast(message);
}

async function processHRData(data) {
    console.log('Received HR data:', data);
    const jsonMessage = { type: 'new_data', data: data };
    const message = JSON.stringify(jsonMessage);
    clients.broadcast(message);
}


module.exports = startConsumer;
