# ------------ Stage 1: Build React App ------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./
RUN npm install

# Copy all frontend files
COPY . .

# 🔥 Inject env variables from build args
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_ML_BACKEND_URL
ARG REACT_APP_ENABLE_PMF
ARG REACT_APP_AI_CHAT_URL

# ✅ Create .env file dynamically
RUN echo "REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL" > .env && \
    echo "REACT_APP_ML_BACKEND_URL=$REACT_APP_ML_BACKEND_URL" >> .env && \
    echo "REACT_APP_ENABLE_PMF=$REACT_APP_ENABLE_PMF" >> .env && \
    echo "REACT_APP_AI_CHAT_URL=$REACT_APP_AI_CHAT_URL" >> .env

# Optional debug (remove later)
RUN cat .env

# Build React app
RUN npm run build


# ------------ Stage 2: Serve with NGINX ------------
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/build /usr/share/nginx/html

COPY ../nginx/nginx.conf /etc/nginx/
COPY ../nginx/default.conf /etc/nginx/conf.d/default.conf

RUN set -eux; \
    if ! getent group nginx > /dev/null 2>&1; then \
        addgroup -g 1001 -S nginx; \
    fi; \
    if ! getent passwd nginx > /dev/null 2>&1; then \
        adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx nginx; \
    fi

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid && \
    chown -R nginx:nginx /etc/nginx/conf.d

USER nginx

CMD ["nginx", "-g", "daemon off;"]