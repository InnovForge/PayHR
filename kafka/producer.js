const kafka = require('../config/kafka');
const producer = kafka.producer();

async function sendToKafka(topic, data, employeeId) {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(data) ,  employeeId }],
  });
}

async function connectProducer() {
  await producer.connect();
}

module.exports = {
  sendToKafka,
  connectProducer,
};
