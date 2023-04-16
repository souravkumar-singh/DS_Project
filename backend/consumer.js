const amqp = require('amqplib');

async function connect() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = 'my-queue';

    await channel.assertQueue(queue, {
      durable: true
    });

    channel.consume(queue, (message) => {
      console.log(`Received message: ${message.content.toString()}`);
      channel.ack(message);
    });

    console.log('Waiting for messages...');

  } catch (error) {
    console.error(error);
  }
}

connect();
