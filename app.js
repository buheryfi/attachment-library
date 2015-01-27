//Need to buy icon for doc thumbnail or find a different free one - this one is not free and not licensed
(function() {
	var self = this;

	return {
		events: {
			'app.activated':'initialize',
			'click .btn':'toggleButtonGroup',
			'click li.clickable':'add_colour', // add class to selected images

			//working with images on page
			'click #getImage': 'getImages',  // switches template to get and shows all images on page as thumbnails in template
			'click #add_images' : 'addToLibrary', // add selected images to library
			'click #add_text' : 'addTextToLibrary',

			//working with images inside of library
			'click #get_library':'getLibrary', // switches template to library and show images from library
			'click #embed_images':'embedImages',
			'click #remove_images':'removeImages',
			'click #preview_document': 'previewDocument',
			'click #open_modal': 'previewDocument'

		},


		resources: {
		},

		requests: {

			putField: function(data) {
				return {
					url: '/api/v2/users/'+user_id+'.json',
					type: 'PUT',
					dataType: 'json',
					contentType: 'application/json; charset=UTF-8',
					data: '{"user": {"user_fields":{"'+this.settings['field_key']+'":"'+data+'"}}}',
				};
			},

			getField: function(data) {
				return {
					url: '/api/v2/users/me.json',
					type: 'GET',
					dataType: 'json',
				};
			}
		},

	    initialize: function() {
	      self.user_id = this.currentUser().id();
	    },

	    getImages: function() {
		    // load attachments from current page to allow interaction with them
				var res = [];
				var tex = [];
				this.ticket().comments().forEach(function(comment){
					comment.nonImageAttachments().forEach(function(nonImage){
						var object = {};
						object.url = nonImage.contentUrl();
						object.name = nonImage.filename();
						tex.push(object);
					});
					comment.imageAttachments().forEach(function(image){
						var object = {};
						object.url = image.contentUrl();
						object.name = image.filename();
						res.push(object);
					});
				});
				if(res.length == 0) {
					this.switchTo("get", {imageList: "<li class=\"imgbox\"><br>No Attachments Found</li>"});
					return;
				}
				var img;
				var imageList = "";
				for (var i = 0; i < res.length; i++) {
					img = this.resizeImage(res[i]);
					imageList += this.renderTemplate("imgbox",
					{
						type: "image",
						src: img.src,
						alt: res[i].name,
						height: img.height,
						width: img.width,
						top: (82-img.height)/2,
						left: (82-img.width)/2
					});
				}
				var nonImg;
				var nonImageList = "";
				for (var i = 0; i < tex.length; i++){
					nonImageList += this.renderTemplate("nonimgbox",
					{
						type: "doc",
						name: tex[i].name,
						url: tex[i].url,
						height: 82,
						width: 82,
						top: 0,
						left: 0
					});
				}
				this.switchTo("get", {imageList: imageList, nonImageList: nonImageList});
	    },

	    getLibrary: function() {
		    // load library page template
		    // load data from user field and render thumbnails
			this.ajax('getField').done(function(data) {
				self.library = data.user.user_fields[this.settings['field_key']];
				this.renderLibrary();
			});
	    },
		renderLibrary: function() {
			if(self.library == null) {
				this.switchTo("library", {imageList: "<li class=\"imgbox\"><br>Nothing Here Yet!</li>"});
				return;
			}
			var res = self.library.split(";");
			var img;
			var imageList = "";
			for (var i = 0; i < res.length-1; i++){
				var attachment = res[i].split(",");
				if (attachment[2] == "image"){
					var imageObject = this.resizeImage(res[i]);
					imageObject.alt = attachment[1];
				} else if (attachment[2] == "text") {
					imageObject = new Image();
					imageObject.src = '';
					imageObject.height = 0;
					imageObject.width = 0;
					imageObject.alt = attachment[1];
				}
				imageList += this.renderTemplate("imgbox",
				{
					alt: imageObject.alt,
					src: imageObject.src,
					height: imageObject.height,
					width: imageObject.width,
					top: (82-imageObject.height)/2,
					left: (82-imageObject.width)/2
				});
			}
			this.switchTo("library", {imageList: imageList});
		},

			// take alt out, or rename so that way this function name makes more sense.
			resizeImage: function(object) {
				var img = new Image();
				img.src = object.url;
				var ratio;
				if(img.width > img.height) {
					ratio = 82/img.width;
				} else {
					ratio = 82/img.height;
				}
				img.height *= ratio;
				img.width *= ratio;
				return img;
			},

	    toggleButtonGroup: function(event) {
			_.each(this.$(event.target).parent().children(),
			function(value) {
				this.$(value).removeClass("active");
			});
			this.$(event.target).addClass("active");
    	},

		add_colour: function(event) {
			if(this.$(event.target).prop('tagName') == "IMG") {
				this.$(event.target).parent().parent().toggleClass("highlight");
			} else if(this.$(event.target).prop('tagName') == "DIV") {
				this.$(event.target).parent().toggleClass("highlight");
			} else {
				this.$(event.target).toggleClass("highlight");
			}
			this.$(".hidden").removeClass("hidden");
		},

		//add attachments to library, including URL, name, and type (txt or image)
		addToLibrary: function(data){
			var value = this.ajax('getField', data).done(function(data) {
				var put_data = '';
				this.$(".highlight").each(function(i, val) {
					if (val.getAttribute("class").indexOf("image") !== -1 ) {
						put_data += val.children[0].children[0].getAttribute("src")+',';
						put_data += val.children[0].children[0].getAttribute("alt")+',';
						put_data += "image;";
					}
					else if (val.getAttribute("class").indexOf("doc")) {
						put_data += val.children[0].children[0].getAttribute("data-url")+',';
						put_data += val.children[0].children[0].getAttribute("alt")+',';
						put_data += "text;";
					}
				});
				var value = data.user.user_fields[this.settings['field_key']];
				if (value !== null) {var bestData = value+put_data;}
				else {var bestData = put_data;}
				this.ajax('putField', bestData);
         	});
		},

		// will remove the thumbnail URL from user field based on user selection
		removeImages: function(data){
			self.$(".highlight").each(function(i, val) {
				var string = val.children[0].children[0].getAttribute("src")+';';
				self.library = self.library.replace(string, '');
			});
			this.ajax('putField', self.library).done(function(data) {
				self.library = data.user.user_fields[this.settings['field_key']];
				this.renderLibrary();
			});
		},

		// will embed an image with Markdown into ticket based on user action
		embedImages: function(data){
			put_data = '';
			self.$(".highlight").each(function(i, val) {
				console.log(val);
				put_data += "![Image from Markdown]("+val.children[0].children[0].getAttribute("src")+") " + "\n";
			});
			current_text = this.comment().text();
			current_text += put_data;
			this.comment().text(current_text);
		},
		
		previewDocument: function(data, target){
			var log = self.$(".highlight > div > img").data('url');
			var url = "http://docs.google.com/viewer?url="+log+"&embedded=true";
			this.$('#modalIframe').attr('src', url);
			this.$('#myModal').modal('show');			
		}
	};

}());
