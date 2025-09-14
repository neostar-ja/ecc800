FROM nginx:1.25-alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create SSL directory and copy certificates
RUN mkdir -p /etc/nginx/certs
COPY certs/ /etc/nginx/certs/

# Set permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chown -R nginx:nginx /etc/nginx/certs && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Don't switch to non-root user for SSL access
# USER nginx

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
