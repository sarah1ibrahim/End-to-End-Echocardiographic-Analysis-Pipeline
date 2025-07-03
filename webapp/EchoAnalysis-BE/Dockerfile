# verssion of existing node
FROM node:20.12.2

# Set the working directory in the container
WORKDIR /app

# Copy files to the container
COPY . /app

# Install dependencies
RUN npm install

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm","start"]