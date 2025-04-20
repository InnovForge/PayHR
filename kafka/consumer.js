const kafka = require('../config/kafka');

async function startConsumer() {
    const consumer = kafka.consumer({ groupId: 'sync-hr-payroll-consumer' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['payroll-updates', 'hr-updates'], });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const data = JSON.parse(message.value.toString());
            switch (topic) {
                case 'payroll-updates':
                    await processPayrollData(data);
                    break;
                case 'hr-updates':
                    await processHRData(data);
                    break;
                default:
                    console.log(`Unhandled topic: ${topic}`);
                    break;
            }
        },
    });
}

async function processPayrollData(data) {
    console.log('Received payroll data:', data);
}

async function processHRData(data) {

    console.log('Received employee data:', data);
}


module.exports = startConsumer;
