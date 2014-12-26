(function() {
	var self = this;

	return {
		events: {
			'app.activated':'initialize',
			'click .btn':'toggleButtonGroup',
			'click .clickable':'add_colour', // add class to selected images
			
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
		    this.switchTo("get");
			this.ticket().comments().forEach(function(comment){
				comment.imageAttachments().forEach(function(image){
					this.$("#insert_stuff").append("<img class=\"clickable\" src=\""+image.thumbnailUrl()+"\"/>");
				});
			});
	    },
	    
	    getLibrary: function() {
		    // load library page template
		    // load data from user field and render thumbnails
		    this.switchTo("library");
			this.ajax('getField').done(function(data) {
				self.library = data.user.user_fields[this.settings['field_key']];
				var res = self.library.split(";");
				for (var i = 0; i < res.length; i++){
					self.$("#insert_stuff").append('<img class="clickable" src="'+res[i]+'"/>');
				}		
			});

	    },
	    
	    toggleButtonGroup: function(event) {
			_.each(this.$(event.target).parent().children(),
			function(value) {
				this.$(value).removeClass("active");
			});
			this.$(event.target).addClass("active");
    	},

		add_colour: function(event) {
			this.$(event.target).toggleClass("highlight");
			this.$(".hidden").removeClass("hidden");		
		},

		addToLibrary: function(data,event){
			var value = this.ajax('getField', data).done(function(data) {
				var put_data = '';
				this.$(".highlight").each(function(i, val) {
					put_data += val.getAttribute("src")+';';
				});
				var newStr = put_data.substring(0, put_data.length-1);
				var value = data.user.user_fields[this.settings['field_key']];
				if (value !== null) {var bestData = value+';'+newStr;}
				else {var bestData = newStr;}
				console.log(bestData);
				this.ajax('putField', bestData);
         	});
		},
		
		// will remove the thumbnail URL from user field based on user selection
		// may still need some work on the characters used to separate fields and ability to remove them as well and not error 
		removeImages: function(data){
			self.$(".highlight").each(function(i, val) {
				var string = val.getAttribute("src")+';';
				self.library = self.library.replace(string, '');
			});
			this.ajax('putField', self.library).done(function(data) {
				self.$("#insert_stuff").html('');
				self.library = data.user.user_fields[this.settings['field_key']];
				var res = self.library.split(";");
				for (var i = 0; i < res.length; i++){
					self.$("#insert_stuff").append('<img class="clickable" src="'+res[i]+'"/>');
				}	
			});
		},
		
		// this currently will add the thumbnail as the embedded image rather than full-size
		// need to determine method to add full-size image, where to store that URL so it can be
		// easily access within this app.
		embedImages: function(data){
			put_data = '';
			self.$(".highlight").each(function(i, val) {
				put_data += "![Image from Markdown]("+val.getAttribute("src")+") " + "\n";
			});
			current_text = this.comment().text();
			current_text += put_data;
			this.comment().text(current_text);
		}

	};

}());
