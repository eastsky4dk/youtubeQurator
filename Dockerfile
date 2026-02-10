FROM nginx:1.27.0-alpine

# Set default port
ENV PORT=8080

# Clean existing html
RUN rm -rf /usr/share/nginx/html/*

# Copy local build output
COPY dist /usr/share/nginx/html

# Copy nginx config template (must end in .template)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Ensure permissions
RUN chmod -R 755 /usr/share/nginx/html

# Environment variables substitution is handled by entrypoint
EXPOSE 8080
