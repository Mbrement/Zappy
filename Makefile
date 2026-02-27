############# Variables #############

GFX_CLIENT_DIR	= ./clients/gfx/scripts
AI_CLIENT_DIR	= ./clients/AI
SERVER_DIR		= ./server.d

############# General #############

all:
	${MAKE} gfx
	${MAKE} client
	${MAKE} server

clean: clean_gfx clean_client clean_server

fclean: fclean_gfx fclean_client fclean_server

re: fclean all

########### Graphical Client ###########

gfx:
	@echo "Building gfx"
	@chmod +x $(GFX_CLIENT_DIR)/buildGFX.sh
	@chmod +x $(GFX_CLIENT_DIR)/smartBuildGFX.sh
	@cd $(GFX_CLIENT_DIR) && ./smartBuildGFX.sh

launch_gfx:
	@cd $(GFX_CLIENT_DIR) && chmod +x runGFX.sh && ./runGFX.sh

clean_gfx:
	@cd $(GFX_CLIENT_DIR) && chmod +x cleanGFX.sh && ./cleanGFX.sh

fclean_gfx: clean_gfx
	@chmod +x $(GFX_CLIENT_DIR)/fcleanGFX.sh
	@cd $(GFX_CLIENT_DIR) && ./fcleanGFX.sh

re_gfx: fclean_gfx gfx

############# AI Client #################

client:
	@echo "Building client"
	@chmod +x clients/AI/buildSea.sh
	@chmod +x clients/AI/smartBuild.sh
	@cd clients/AI && ./smartBuild.sh

clean_client:
	@cd $(AI_CLIENT_DIR) && npm cache clean --force && rm -rf node_modules package-lock.json

fclean_client: clean_client
	@rm -rf $(AI_CLIENT_DIR)/logs
	@rm -rf client

############# Server #############

server:
	@echo "Building server"
	@cd $(SERVER_DIR) && cargo build --release --target-dir . --bin server
	@cp $(SERVER_DIR)/release/server .
	@rm -rf .rustc_info.json

clean_server:
	@cd $(SERVER_DIR) && cargo clean

fclean_server: clean_server
	@rm -rf $(SERVER_DIR)/release
	@rm -rf server

.PHONY: gfx launch_gfx clean_gfx fclean_gfx re_gfx client clean_client fclean_client server clean_server fclean_server all clean fclean re