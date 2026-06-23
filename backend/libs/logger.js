import { createLogger, format, transports } from 'winston';

const { combine, timestamp, json, errors } = format;

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new transports.Console()
  ]
});

export default logger;
