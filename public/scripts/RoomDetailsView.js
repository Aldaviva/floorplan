this.RoomDetailsView = (function(){

	var CONTROL_PROTOCOL_TO_MANUFACTURER = {
		'TANDBERG_SSH'   : 'Cisco',
		'TANDBERG_HTTP'  : 'Cisco',
		'POLYCOM_TELNET' : 'Polycom',
		'LIFESIZE_SSH'   : 'LifeSize'
	};

	var RoomDetailsView = Backbone.View.extend({

		className: "roomDetailsView detailsView",

		initialize: function(){
			_.bindAll(this);

			this.els = {};

			data.endpoints.on('status', this.onStatusUpdate);
		},

		render: function(){
			if(this.$el.is(':empty')){
				this.els.photo = $('<img>', { class: 'photo' });
				this.els.name  = $('<h2>',  { class: 'name' });

				this.$el.append(this.els.photo);
				this.$el.append(this.els.name);

				this.els.endpointManufacturer = $('<dd>');
				this.els.endpointIpAddress = $('<dd>');
				this.els.availabilityStatus = $('<dd>').append([
					$('<span>', { "class": "statusBadge" }),
					$('<span>', { "class": "statusLabel" })
				]);

				var dl = $('<dl>');

				dl.append($('<dt>', { text: 'Status' }));
				dl.append(this.els.availabilityStatus);

				dl.append($('<dt>', { text: 'Endpoint' }));
				dl.append(this.els.endpointManufacturer);

				dl.append($('<dt>', { text: 'IP Address' }));
				dl.append(this.els.endpointIpAddress);

				this.$el.append(dl);
			}

			if(this.model){
				this.els.photo.attr('src', config.mountPoint + '/endpoints/'+this.model.id+'/photo'); //causes flickering in Opera

				this.els.name.text(this.model.get('name'));

				this.els.endpointManufacturer.text(this.getManufacturerLabel(this.model.get('controlProtocol')));

				this.els.endpointIpAddress.text(this.model.get('ipAddress'));

				this.renderStatus();

				this.$el.show();
			} else {
				this.$el.hide();
			}

			return this.el;
		},

		renderStatus: function(){
			if(this.model.status){
				this.els.availabilityStatus.find('.statusLabel').text(this.getStatusLabel());
				this.els.availabilityStatus.find('.statusBadge').toggleClass('busy', this.isBusy());
				this.els.availabilityStatus.show();
			} else {
				this.els.availabilityStatus.hide();
			}
		},

		onStatusUpdate: function(endpoint, status){
			if(this.model && (endpoint.id == this.model.id)){
				this.renderStatus();
			}
		},

		getManufacturerLabel: function(){
			return CONTROL_PROTOCOL_TO_MANUFACTURER[this.model.get('controlProtocol')] || "other";
		},

		getStatusLabel: function(){
			if(this.model.status.callActive){
				return "in a call";
			} else if(this.model.status.reserved){
				return "reserved";
			} else {
				return "available";
			}
		},

		isBusy: function(){
			var endpointStatus = this.model.status;
			return endpointStatus.callActive || endpointStatus.reserved;
		}

	});

	return RoomDetailsView;

})();