const amqp = require('amqplib');

async function connect() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = 'my-queue';

    await channel.assertQueue(queue, {
      durable: true
    });

    const message = 'Hello, RabbitMQ!';

    channel.sendToQueue(queue, Buffer.from(message), {
      persistent: true
    });

    console.log(`Sent message: ${message}`);

    await channel.close();
    await connection.close();

  } catch (error) {
    console.error(error);
  }
}

connect();
