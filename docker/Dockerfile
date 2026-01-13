# ------------ Stage 1: Build React App ------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and lock file
COPY ../package*.json ./
RUN npm install

# Copy all frontend files
COPY .. .

# Build the production React app
RUN npm run build


# ------------ Stage 2: Serve with NGINX ------------
FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy React build output
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom NGINX config
COPY ../nginx/nginx.conf /etc/nginx/
COPY ../nginx/default.conf /etc/nginx/conf.d/default.conf

# Check if nginx user/group already exists, if not, create them
RUN set -eux; \
    if ! getent group nginx > /dev/null 2>&1; then \
        addgroup -g 1001 -S nginx; \
    fi; \
    if ! getent passwd nginx > /dev/null 2>&1; then \
        adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx nginx; \
    fi

# Set Permission for non-root user with ownership
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Set user context
USER nginx

CMD ["nginx", "-g", "daemon off;"]
