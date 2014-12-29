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

			//working with images inside of library
			'click #get_library':'getLibrary', // switches template to library and show images from library
			'click #embed_images':'embedImages',
			'click #remove_images':'removeImages'

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
		    // load images from current page to allow interaction with them
		    // need to add functionality to deal with non-image attachments?
				var res = [];
				this.ticket().comments().forEach(function(comment){
					comment.imageAttachments().forEach(function(image, i, arr){
						res.push(image.contentUrl());
						//this.$("#insert_stuff").append("<img class=\"clickable\" src=\""+image.thumbnailUrl()+"\"/>");
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
						src: img.src,
						height: img.height,
						width: img.width,
						top: (82-img.height)/2,
						left: (82-img.width)/2
					});
				}
				//self.$("#insert_stuff").append('<img class="clickable" src="'+res[i]+'"/>');
				this.switchTo("get", {imageList: imageList});
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
				for (var i = 0; i < res.length-1; i++) {
					img = this.resizeImage(res[i]);
					imageList += this.renderTemplate("imgbox",
					{
						src: img.src,
						height: img.height,
						width: img.width,
						top: (82-img.height)/2,
						left: (82-img.width)/2
					});
					//self.$("#insert_stuff").append('<img class="clickable" src="'+res[i]+'"/>');
				}
				this.switchTo("library", {imageList: imageList});
			},

			resizeImage: function(url) {
				var img = new Image();
				img.src = url;
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

		addToLibrary: function(data,event){
			var value = this.ajax('getField', data).done(function(data) {
				var put_data = '';
				this.$(".highlight").each(function(i, val) {
					put_data += val.children[0].children[0].getAttribute("src")+';';
				});
				var value = data.user.user_fields[this.settings['field_key']];
				if (value !== null) {var bestData = value+put_data;}
				else {var bestData = put_data;}
				console.log(bestData);
				this.ajax('putField', bestData);
         	});
		},

		// will remove the thumbnail URL from user field based on user selection
		// may still need some work on the characters used to separate fields and ability to remove them as well and not error
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

		// this currently will add the thumbnail as the embedded image rather than full-size
		// need to determine method to add full-size image, where to store that URL so it can be
		// easily access within this app.
		embedImages: function(data){
			put_data = '';
			self.$(".highlight").each(function(i, val) {
				put_data += "![Image from Markdown]("+val.children[0].children[0].getAttribute("src")+") " + "\n";
			});
			current_text = this.comment().text();
			current_text += put_data;
			this.comment().text(current_text);
		}

	};

}());
