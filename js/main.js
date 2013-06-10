

"use strict";


var pMaps = {


	//Preprocessed file, loaded in index
	possibleLayers: null,


	matchedLayers: [],

	useLayers: null,

	map: null,

	testDate: 1940,

	activeLayer: null,

	everyDay: {},


	markerLookup: {},

	theaterList: {},

	byTimeStamp: {},

	availableTimestamps: [],


	timer: null,

	debug: true,




	markerOpen: null,
	markerShow: null,


	init: function(){


		var self = this;


		window.setTimeout(function(){

			self.processData();

		}, 250);
		

		$("#buttonPlay").click(function(){

			self.timePlay();


		});


		$("#buttonStop").click(function(){

			self.timeStop();


		});

		//$("#rangeSlider").mouseup(function() { 

		//      self.renderMarkers(); 

		 //});

		$("#rangeSlider").change(function() { 

		      self.renderMarkers();   
			//var today = $("#rangeSlider").val();
			//$("#dataTitle").text(new Date(today * 1000).format('n/d/Y'));


		 });


		


		this.possibleLayers = possibleLayers;




		this.markerOpen = L.AwesomeMarkers.icon({
		  color: 'darkblue'
		});

		this.markerShow = L.AwesomeMarkers.icon({
		  color: 'blue'
		});

	
		this.map = L.map('map', {crs: L.CRS.EPSG900913, maxZoom: 20}).setView([40.7484, -73.9802], 13);

		this.layer1857 = L.tileLayer.wms("http://maps.nypl.org/warper/layers/wms/859", {
		    format: 'image/png',
		    transparent: false,
		    attribution: "",
		    version: "1.1.1"
		});


		this.layer1854 = L.tileLayer.wms("http://maps.nypl.org/warper/layers/wms/861", {
		    format: 'image/png',
		    transparent: false,
		    attribution: "",
		    version: "1.1.1"
		});


		this.layer1911 = L.tileLayer.wms("http://maps.nypl.org/warper/layers/wms/871", {
		    format: 'image/png',
		    transparent: false,
		    attribution: "",
		    version: "1.1.1"
		});



		this.layer1897 = L.tileLayer.wms("http://maps.nypl.org/warper/layers/wms/863", {
		    format: 'image/png',
		    transparent: false,
		    attribution: "",
		    version: "1.1.1"
		});


		//this.base = L.tileLayer('http://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		this.base = L.tileLayer('http://c.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg', {
			
		    attribution: ''
		}).addTo(this.map);

		this.map.addLayer(this.layer1911);
		this.map.addLayer(this.layer1897);

		this.map.addLayer(this.layer1857);
		this.map.addLayer(this.layer1854);

		this.layer1911.setOpacity(0);
		this.layer1897.setOpacity(0);
		this.layer1857.setOpacity(0);
		this.layer1854.setOpacity(0);		
		this.base.setOpacity(0);



		this.selectLayer();
		//map.addLayer(map1897);





	},

	processData: function(){


		if (!theaterData)
			alert('Data not found');


		var startYear = '1850';
		var endYear = '2014';

		var startYearStamp = +(new Date(startYear)) / 1000;
		var endYearStamp = +(new Date(endYear)) / 1000;

		for (var i = startYearStamp; i < endYearStamp; i = i + 86400){
			this.everyDay[String(i)] = {};
		}

		//now we have a object of every day for the date range

		var theaters = {};
		var events = {};

		//build an object of all the theaters
		for (var i = 0; i <= theaterData.length; i = i + 1){



			if (typeof theaterData[i] != 'undefined'){
				if (!theaters.hasOwnProperty(theaterData[i].TheaterObject.ID)){

					theaters[theaterData[i].TheaterObject.ID] = theaterData[i].TheaterObject;
					theaters[theaterData[i].TheaterObject.ID].status = 'closed';
					theaters[theaterData[i].TheaterObject.ID].statusText = '';

				}



				//while we are here try to pull out the timestamp of the event if possible.
				var date = theaterData[i].Date;


				if (date != 'null'){


					if (date.substring('T') != -1){
						date = date.split('T')[0];

						//console.log(date);

					}

					var timeStamp = +(new Date(String(date))) / 1000;

					if (!isNaN(timeStamp)){

						var aEvent = theaterData[i].Event;

						aEvent.theaterID = theaterData[i].TheaterObject.ID;



						//already an event on this date?
						if (!events.hasOwnProperty(String(timeStamp))){

							events[String(timeStamp)] = [];
							events[String(timeStamp)].push(aEvent);
							

						//console.log(aEvent);

						}else{

							events[String(timeStamp)].push(aEvent);

						}


					}


				}




			}

 

		}


		this.theaterList = theaters;


		//we have a object of every theater, walk through the timeline and update the object of any changes for that day
		//this way we will have a timeline repition of the theaters,


		var clonedTheaters = theaters;

		for (var i = startYearStamp; i < endYearStamp; i = i + 86400){



			//did anything happen today?
			if (events.hasOwnProperty(String(i))){

				//yes!

				for (var x in events[String(i)]){


					//update the theater object of what happend
					theaters[String(events[String(i)][x].theaterID)].status = events[String(i)][x].type;
					theaters[String(events[String(i)][x].theaterID)].statusText = events[String(i)][x].ShowInfo;


				}

				//store a reference to this cloned version of the theaters.....
				clonedTheaters = clone(theaters);
				this.everyDay[String(i)] = clonedTheaters;


			}else{

				//..... if there is no update just use the last cloned reference
				this.everyDay[String(i)] = clonedTheaters;
			}

		}		



		//place the markers
		this.addMarkers();


 

	},

	selectLayer: function(year){

		if (typeof year === 'undefined'){

			year = 1850;
		}


		var useLayer = this.base;






		if (year <= 1905){
			useLayer = this.layer1897;
		}

		if (year >= 1906){
			useLayer = this.layer1911;
		}

		if (year >= 1940){
			useLayer = this.base;
		}

		if (year <= 1875){
			useLayer = this.layer1857;
		}		

		if (year <= 1860){
			useLayer = this.layer1854;
		}			

		if (this.activeLayer && this.activeLayer !== useLayer){

			this.activeLayer.setOpacity(0);

			useLayer.setOpacity(1);

			this.activeLayer = useLayer;

		}

		if (this.activeLayer === null){

			useLayer.setOpacity(1);

			this.activeLayer = useLayer;

		}



	},






	addMarkers: function(){


		var self = this;




		$.each(self.theaterList, function(index, value){



			var aMarkerOpen = L.marker([parseFloat(value.Lat),parseFloat(value.Long)], {icon: self.markerOpen}).addTo(self.map);
			var aMarkerShow = L.marker([parseFloat(value.Lat),parseFloat(value.Long)], {icon: self.markerShow}).addTo(self.map);

			aMarkerOpen.setOpacity(0);
			aMarkerShow.setOpacity(0);

			self.markerLookup[String(value.ID)] = {open: aMarkerOpen, show: aMarkerShow};




		});





	},

	toggleMarker: function(id,state){

		var self = this;





		if (state === 'open'){

			self.markerLookup[id].open.setOpacity(1); 
			self.markerLookup[id].show.setOpacity(0); 

		}

		if (state === 'show'){

			self.markerLookup[id].open.setOpacity(0); 
			self.markerLookup[id].show.setOpacity(1); 

		}

		if (state === 'closed'){

			self.markerLookup[id].open.setOpacity(0); 
			self.markerLookup[id].show.setOpacity(0); 

		}



	},


	timePlay: function(){


		var self = this;

		window.clearInterval(this.timer);

		this.timer = window.setInterval(function(){

			self.processDay();

		}, 5);



	},

	timeStop: function(){

		window.clearInterval(this.timer);


	},


	processDay: function(){


		var currentDay = $("#rangeSlider").val();

		var nextDay = parseInt(currentDay) + 86000;


		this.selectLayer(new Date(nextDay * 1000).format('Y'));


		$("#rangeSlider").val(nextDay);


		
		this.renderMarkers();

		//console.log($("#rangeSlider").val());

	},


	renderMarkers: function(){



		var today = $("#rangeSlider").val();
		$("#dataTitle").text(new Date(today * 1000).format('Y-m-N'));


		this.selectLayer(new Date(today * 1000).format('Y'));


		//console.log(today, $("#dataTitle").text(),this.everyDay[today]['1559'].status,this.everyDay[today]['1559'].statusText);

		for (var x in this.everyDay[String(today)]){

			var id = this.everyDay[String(today)][String(x)].ID;
			var status = this.everyDay[String(today)][String(x)].status;
			var statusText = this.everyDay[String(today)][String(x)].statusText;

			if (status === 'ShowOpen'){

				this.markerLookup[id].show.setOpacity(1);
				this.markerLookup[id].open.setOpacity(0);


			}else if(status === "NameChange" || status === "ShowClose"){
				this.markerLookup[id].show.setOpacity(0);
				this.markerLookup[id].open.setOpacity(1);

			}else if(status === "closed"){

				this.markerLookup[id].show.setOpacity(0);
				this.markerLookup[id].open.setOpacity(0);

			}


		}

	}







}






$(function() {


	pMaps.init();
     
    


 });




Object.prototype.hasOwnProperty = function(property) {
    return this[property] !== undefined;
};



// Simulates PHP's date function
Date.prototype.format=function(e){var t="";var n=Date.replaceChars;for(var r=0;r<e.length;r++){var i=e.charAt(r);if(r-1>=0&&e.charAt(r-1)=="\\"){t+=i}else if(n[i]){t+=n[i].call(this)}else if(i!="\\"){t+=i}}return t};Date.replaceChars={shortMonths:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],longMonths:["January","February","March","April","May","June","July","August","September","October","November","December"],shortDays:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],longDays:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],d:function(){return(this.getDate()<10?"0":"")+this.getDate()},D:function(){return Date.replaceChars.shortDays[this.getDay()]},j:function(){return this.getDate()},l:function(){return Date.replaceChars.longDays[this.getDay()]},N:function(){return this.getDay()+1},S:function(){return this.getDate()%10==1&&this.getDate()!=11?"st":this.getDate()%10==2&&this.getDate()!=12?"nd":this.getDate()%10==3&&this.getDate()!=13?"rd":"th"},w:function(){return this.getDay()},z:function(){var e=new Date(this.getFullYear(),0,1);return Math.ceil((this-e)/864e5)},W:function(){var e=new Date(this.getFullYear(),0,1);return Math.ceil(((this-e)/864e5+e.getDay()+1)/7)},F:function(){return Date.replaceChars.longMonths[this.getMonth()]},m:function(){return(this.getMonth()<9?"0":"")+(this.getMonth()+1)},M:function(){return Date.replaceChars.shortMonths[this.getMonth()]},n:function(){return this.getMonth()+1},t:function(){var e=new Date;return(new Date(e.getFullYear(),e.getMonth(),0)).getDate()},L:function(){var e=this.getFullYear();return e%400==0||e%100!=0&&e%4==0},o:function(){var e=new Date(this.valueOf());e.setDate(e.getDate()-(this.getDay()+6)%7+3);return e.getFullYear()},Y:function(){return this.getFullYear()},y:function(){return(""+this.getFullYear()).substr(2)},a:function(){return this.getHours()<12?"am":"pm"},A:function(){return this.getHours()<12?"AM":"PM"},B:function(){return Math.floor(((this.getUTCHours()+1)%24+this.getUTCMinutes()/60+this.getUTCSeconds()/3600)*1e3/24)},g:function(){return this.getHours()%12||12},G:function(){return this.getHours()},h:function(){return((this.getHours()%12||12)<10?"0":"")+(this.getHours()%12||12)},H:function(){return(this.getHours()<10?"0":"")+this.getHours()},i:function(){return(this.getMinutes()<10?"0":"")+this.getMinutes()},s:function(){return(this.getSeconds()<10?"0":"")+this.getSeconds()},u:function(){var e=this.getMilliseconds();return(e<10?"00":e<100?"0":"")+e},e:function(){return"Not Yet Supported"},I:function(){var e=null;for(var t=0;t<12;++t){var n=new Date(this.getFullYear(),t,1);var r=n.getTimezoneOffset();if(e===null)e=r;else if(r<e){e=r;break}else if(r>e)break}return this.getTimezoneOffset()==e|0},O:function(){return(-this.getTimezoneOffset()<0?"-":"+")+(Math.abs(this.getTimezoneOffset()/60)<10?"0":"")+Math.abs(this.getTimezoneOffset()/60)+"00"},P:function(){return(-this.getTimezoneOffset()<0?"-":"+")+(Math.abs(this.getTimezoneOffset()/60)<10?"0":"")+Math.abs(this.getTimezoneOffset()/60)+":00"},T:function(){var e=this.getMonth();this.setMonth(0);var t=this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/,"$1");this.setMonth(e);return t},Z:function(){return-this.getTimezoneOffset()*60},c:function(){return this.format("Y-m-d\\TH:i:sP")},r:function(){return this.toString()},U:function(){return this.getTime()/1e3}}

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}
