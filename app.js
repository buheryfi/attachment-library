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
			'click #embed_link':'embedLinks',
			'click #remove_images':'removeImages',
			'click #preview_item': 'previewItem',
			
			// working with Remote Content
			'click #getExternal': 'getExternal',
			'click #addExternal': 'addExternalToLibrary',
			
			// Growler notifications for external requests
			'putField.done': function() {
				services.notify('Item(s) Successfully Added.');
			},
			'putField.fail': function() {
				services.notify('Item(s) could not be added.  Contact your administrator.');
			}

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
				var att = [];
				this.ticket().comments().forEach(function(comment){
					comment.nonImageAttachments().forEach(function(nonImage){
						var object = {};
						object.url = nonImage.contentUrl();
						object.name = nonImage.filename();
						object.type = "text";
						att.push(object);
					});
					comment.imageAttachments().forEach(function(image){
						var object = {};
						object.url = image.contentUrl();
						object.name = image.filename();
						object.type = "image";
						att.push(object);
					});
				});
				if(att.length == 0) {
					this.switchTo("get", {imageList: "<li class=\"imgbox\"><br>No Attachments Found</li>"});
					return;
				}
				//  render attachments
				var attachment;
				var attachmentList = "";
				for (var i = 0; i < att.length; i++){
					if (att[i].type == "text"){
						attachmentList += this.renderTemplate("imgbox",
						{
							type: att[i].type,
							src: '',
							alt: att[i].name,
							height: 0,
							width: 0,
							top: 0,
							left: 0,
							data_url: att[i].url
						});
					}
					else if (att[i].type == "image"){
						attachment = this.resizeImage(att[i].url);
						attachmentList += this.renderTemplate("imgbox",
						{
							type: att[i].type,
							src: att[i].url,
							alt: att[i].name,
							height: attachment.height,
							width: attachment.width,
							top: (82-attachment.height)/2,
							left: (82-attachment.width)/2,
							data_url: att[i].url
						});
					}
					else {return}; 
				}
				this.switchTo("get", {imageList: attachmentList});
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
					var imageObject = this.resizeImage(attachment[0]);
					imageObject.alt = attachment[1];
					imageObject.data_url = attachment[0];
					imageObject.top = (82-imageObject.height)/2;
					imageObject.left = (82-imageObject.width)/2;
					imageObject.type = "image";
				} else if (attachment[2] == "text") {
					var imageObject = new Image();
					imageObject.src = '';
					imageObject.height = 0;
					imageObject.width = 0;
					imageObject.alt = attachment[1];
					imageObject.data_url = attachment[0];
					imageObject.top = 0;
					imageObject.left = 0;
					imageObject.type = "text";
				}
				imageList += this.renderTemplate("imgbox",
				{
					alt: imageObject.alt,
					src: imageObject.src,
					height: imageObject.height,
					width: imageObject.width,
					top: imageObject.top,
					left: imageObject.left,
					data_url: imageObject.data_url,
					type: imageObject.type
				});
			}
			this.switchTo("library", {imageList: imageList});
		},

		resizeImage: function(object) {
			var img = new Image();
			img.src = object;
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
		    if(this.$(event.target).parent().hasClass("btn-group")) {
			    _.each(this.$(event.target).parent().children(),
				function(value) {
					this.$(value).removeClass("active");
				});
				this.$(event.target).addClass("active");
		    }
    	},

		// this function handles the currently selected item by toggling classes
		// and also detects how many items selected, and disables
		// the preview button should more than one item be selected.
		add_colour: function(event) {
			if(this.$(event.target).prop('tagName') == "IMG") {
				this.$(event.target).parent().parent().toggleClass("highlight");
			} else if(this.$(event.target).prop('tagName') == "DIV") {
				this.$(event.target).parent().toggleClass("highlight");
			} else {
				this.$(event.target).toggleClass("highlight");
			}
			var numItems = this.$(".highlight").length;
			if ( numItems > 1) {this.$("#preview_item").prop("disabled", true); }
			else if ( numItems <= 1) {this.$("#preview_item").prop("disabled", false);}
			this.$(".hidden").removeClass("hidden");
		},

		//add attachments to library, including URL, name, and type (txt or image)
		addToLibrary: function(data){
			var value = this.ajax('getField', data).done(function(data) {
				var put_data = '';
				this.$(".highlight").each(function(i, val) {
					var alt = val.children[0].children[0].getAttribute("alt");
					alt = alt.replace(/[,;]/g , ' ');
					if (val.getAttribute("class").indexOf("image") !== -1 ) {
						put_data += val.children[0].children[0].getAttribute("src")+',';
						put_data += alt+',';
						put_data += "image;";
					}
					else if (val.getAttribute("class").indexOf("doc")) {
						put_data += val.children[0].children[0].getAttribute("data-contentURL")+',';
						put_data += alt+',';
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
		// this does not work with new data model.
		// currently we are removing based on matching a URL string. 
		// this needs to account for a different data structure, using the index
		removeImages: function(data){
			self.$(".highlight").each(function(i, val) {
				var string = val.children[0].children[0].getAttribute("data-contentURL")+';';
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
				put_data += "![Image from Markdown]("+val.children[0].children[0].getAttribute("src")+") " + "\n";
			});
			current_text = this.comment().text();
			current_text += put_data;
			this.comment().text(current_text);
		},
		
		embedLinks: function(data){
			put_data = '';
			self.$(".highlight").each(function(i, val) {
				put_data += "["+val.children[0].children[0].getAttribute("alt")+"]("+val.children[0].children[0].getAttribute("data-contentURL")+")";
			});
			current_text = this.comment().text();
			current_text += put_data;
			this.comment().text(current_text);	
		},
		
		// show preview of selected Text File using Google Docs API in a modal Iframe
		previewItem: function(data, target){
			var log = self.$(".highlight > div > img").attr('data-contenturl');
			var url = "http://docs.google.com/viewer?url="+log+"&embedded=true";
			this.$('#modalIframe').attr('src', url);
			this.$('#myModal').modal('show');			
		},
		
		getExternal: function() {
			this.switchTo("external");
		},
		
		//  This allows the end-user to add images or files hosted externally to be stored
		//  inside of their library
		// how should we determine if this is image or text?
		// look at mime type, extension, or allow for user choice?
		// should we restrict which types of extensions can be added?
		// what is to stop him from uploading other types of files? OK?
		addExternalToLibrary: function() {
			var fileLocation = this.$("externalURL").val()+',';
			var fileName = this.$("#externalFileName").val()+',';
			var value = this.ajax('getField').done(function(data) {
				var value = data.user.user_fields[this.settings['field_key']];
				if (value !== null) {var bestData = value+this.$("#externalURL").val()+';';}
				else {var bestData = this.$("#externalURL").val();}
				this.ajax('putField', bestData);
			});
		}
	};

}());
