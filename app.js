(function() {
	var self = this;

	return {
		events: {
			'click #click_me':'clicked_event',
			'click .clickable':'add_colour',
			'click #buttonid':'add_field',
			'click #getfieldbutton':'get_field',
			'getField.done' : 'show_field',
			'click #comparebutton' : 'compare_field',
			'compareField.done' : 'compare'
		},

		resources: {
		},

		requests: {
			putField: function(data) {
				return {
					url: '/api/v2/users/me.json',
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
			},

			compareField: function() {
				return {
					url: '/api/v2/users/me.json',
					type: 'GET',
					dataType: 'json',
				};
			}
		},

		clicked_event: function() {

			var ticket = this.ticket();
			ticket.comments().forEach(function(comment){
				//console.log(comment.imageAttachments());
				//console.log(comment.imageAttachments()[0].contentType());
				//console.log(comment.imageAttachments()[0].contentUrl());
				//console.log(comment.imageAttachments()[0].filename());
				//console.log(comment.imageAttachments()[0].token());
				//console.log(comment.imageAttachments()[0].thumbnailUrl());

				//jsonText = JSON.stringify(user);
				//console.log(this.jsonText);
				comment.imageAttachments().forEach(function(image){
					this.$("#insert_stuff").append("<img class=\"clickable\" src=\""+image.thumbnailUrl()+"\"/>");
					this.user = {};
					this.user.contentUrl = comment.imageAttachments()[0].contentUrl();
					this.user.thumbnailUrl = comment.imageAttachments()[0].thumbnailUrl();
					var jsonText = this.user.contentUrl + " ; " + this.user.thumbnailUrl;
				});
				//if(comment.nonImageAttachments() !== "") {console.log(comment.nonImageAttachments().thumbnailUrl())};
			});
			//console.log(jsonText);
		},

		add_colour: function(event) {
			this.$(event.target).toggleClass("highlight");
			this.show();
		},

		show: function(event) {
			this.$(".hidden").removeClass("hidden");
		},

		add_field: function(data, event) {
			var put_data = '';
			this.$(".highlight").each(function(i, val) {
				//put_data.push(val.getAttribute("src"));
				put_data += val.getAttribute("src")+';';
				//console.log(put_data);
				//return put_data;
			});
			//this.ajax('putField', data);
			//send_me = JSON.stringify(put_data);
			var newStr = put_data.substring(0, put_data.length-1);
			//console.log(newStr);
			this.ajax('putField', newStr);
		},

		get_field: function(event, data) {
			var value = this.ajax('getField', data);
			//console.log(value);
		},

		compare_field: function(data,event){
			var value = this.ajax('compareField', data);
		},

		compare: function(data, event){
			var put_data = '';
			this.$(".highlight").each(function(i, val) {
				put_data += val.getAttribute("src")+';';
			});
			var newStr = put_data.substring(0, put_data.length-1);
			var value = data.user.user_fields[this.settings['field_key']];
			var bestData = value+';'+newStr;
			this.ajax('putField', bestData);
			//console.log(bestData);
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
