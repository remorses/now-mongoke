

dev:
	yarn build
	rm -rf example/.now
	cd example && now dev -d

prod:
	rm -rf example_prod/.now
	cd example_prod && now dev -d

deploy_example:
	cd example_prod && now

try:
	DB_URL=mongodb://localhost/db  python example/.now/cache/main/now__handler__python.py