#!/bin/sh
set -eu

if [ -z "${BACKEND_URL:-}" ] && [ -n "${BACKEND_HOST:-}" ]; then
  BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT:-8000}"
fi

BACKEND_URL="${BACKEND_URL:-http://backend:8000}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  API_URL: "${API_URL:-/api}"
};
EOF

cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen ${PORT:-80};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location = /health {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "ok\n";
    }

    location = /config.js {
        add_header Cache-Control "no-store";
        try_files \$uri =404;
    }

    location /api/ {
        proxy_pass ${BACKEND_URL}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
}
EOF
