(function() {
	var self = this;

	return {
		events: {
			'app.activated':'doSomething',
			'click .btn':'toggleButtonGroup',
			'click .clickable':'add_colour', // add class to selected images
			//working with images on page
			'click #getImage': 'getImages',  // switches template to get and shows all images on page as thumbnails in template
			'click #add_images' : 'addToLibrary', // add selected images to library
			//working with images inside of library
			'click #get_library':'getLibrary', // switches template to library and show images from library
			'click #embed_images':'embed_images', 
			
			
			'getField.done' : 'show_field',

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

			getField: function() {
				return {
					url: '/api/v2/users/me.json',
					type: 'GET',
					dataType: 'json',
				};
			}
		},

	    doSomething: function() {
	      this.switchTo("main");
	      self.user_id = this.currentUser().id();
	    },
	    
	    getImages: function() {
		    this.switchTo("get");
			this.ticket().comments().forEach(function(comment){
				comment.imageAttachments().forEach(function(image){
					this.$("#insert_stuff").append("<img class=\"clickable\" src=\""+image.thumbnailUrl()+"\"/>");
					this.user = {};
					this.user.contentUrl = comment.imageAttachments()[0].contentUrl();
					this.user.thumbnailUrl = comment.imageAttachments()[0].thumbnailUrl();
					var jsonText = this.user.contentUrl + " ; " + this.user.thumbnailUrl;
				});
				//if(comment.nonImageAttachments() !== "") {console.log(comment.nonImageAttachments().thumbnailUrl())};
			});
	    },
	    
	    getLibrary: function() {
		    this.switchTo("library");
			this.ajax('getField');
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
			this.show();
		},

		show: function(event) {
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
				var bestData = value+';'+newStr;
				this.ajax('putField', bestData);
         	});
		},

		show_field: function(data) {
			var value = data.user.user_fields[this.settings['field_key']];
			var res = value.split(";");
			console.log(res);
			for (var i = 0; i < res.length; i++){
				this.$("#insert_stuff").append('<img class="clickable" src="'+res[i]+'"/>');
			}
		}


	};

}());
