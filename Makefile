

dev:
	yarn build
	rm -rf example/.now
	cd example && now dev

try:
	DB_URL=mongodb://localhost/db  python example/.now/cache/main/now__handler__python.py