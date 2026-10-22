# Step 1: Use official Node image
FROM node:22-alpine

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy rest of the app
COPY . .

# Step 5: Build production-ready widget (dist/widget)
RUN npm run build

# Step 6: Serve the built widget via vite preview on port 4173
EXPOSE 4173
CMD [ "npm", "run", "preview" ]
