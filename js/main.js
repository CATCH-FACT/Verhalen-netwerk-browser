window.onload = function () {
    console.log("loading main");

    ko.bindingHandlers.slider = {
      init: function (element, valueAccessor, allBindingsAccessor) {
          var options = allBindingsAccessor().sliderOptions || {};
          $(element).slider(options);
          ko.utils.registerEventHandler(element, "slidechange", function (event, ui) {
              var observable = valueAccessor();
              observable(ui.value);
          });
          ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
              $(element).slider("destroy");
          });
          ko.utils.registerEventHandler(element, "slide", function (event, ui) {
              var observable = valueAccessor();
              observable(ui.value);
          });
      },
      update: function (element, valueAccessor) {
          var value = ko.utils.unwrapObservable(valueAccessor());
          if (isNaN(value)) value = 0;
          $(element).slider("value", value);
      }
    };
    
    var vm = new ViewModel();
    ko.applyBindings(vm);

    var nodeman = new NodeViewer(vm);
    nodeman.init();

    var waitman = new WaitViewer(vm);
    waitman.init(true);

    var menuman = new MenuViewer(vm);
    menuman.init();

    var pieman = new PieViewer(vm);
    pieman.init();

    if (getUrlParameter("minscore")){
        console.log("MINSCORE::::");
        console.log(getUrlParameter("minscore"));
        vm.min_neighbor_score(getUrlParameter("minscore"));
    }

    if (getUrlParameter("ids")){
        vm.id_search_query(getUrlParameter("ids"));
        vm.doIdSearch();
    }

    if (getUrlParameter("solr")){
        console.log(getUrlParameter("solr"));
        vm.solr_search_command(getUrlParameter("solr"));
        vm.doSolrSearch();
    }
    
    // url parameter check
    var waiting_time = 20;
    if (getUrlParameter("depth")){
        for (var i = 0; i < getUrlParameter("depth"); i++) { 
            waiting_time += i + i * 200;
            setTimeout(function(){
                vm.waiting(true);
                NeighborNeighbor(1, vm.max_neighbor_results(), vm.min_neighbor_score(), vm);
            }, waiting_time);
        }
    }
    if (getUrlParameter("reconnect")){
        setTimeout(function(){
            vm.waiting(true);
            ConnectNeighbors(vm);
        }, waiting_time + 3000);
    }
    setTimeout(function(){
        vm.waiting(false);
    }, waiting_time + 3000);
    
}

var n_n_depth = 0;

var waiting = false;

var show_info_windows = true;
var show_help_windows = true;

var solr_search_proxy = 'data_proxy.php?s&q=';
var id_search_proxy = 'data_proxy.php?i&q=';
var neighbor_search_proxy = 'data_proxy.php?ns&q=';
var facet_proxy = 'data_proxy.php?f&q='

var show_facets = ["item_type", "subject",
                    "collector", "creator", "date",
                    "subgenre", "type", "language", "literary", "extreme",
                    "tags", "named_entity","named_entity_location", "place_of_action", "motif", 
                    "text_length_group", "locality", "administrative_area_level_1"];
var facet_addition = "&facet=true&facet.mincount=1&wt=json&rows=0&facet.field=" + show_facets.join("&facet.field=")

var metadatas_to_query = [  {key: "title",          score_value: 1,     selected: true},
                            {key: "subject",        score_value: 1,     selected: true},
                            {key: "creator",	    score_value: 1,     selected: false},
                            {key: "contributor",	score_value: 1,     selected: false},
                            {key: "collector",	    score_value: 1,     selected: false},
                            {key: "language",	    score_value: 1,     selected: false},
                            {key: "source",	        score_value: 1,     selected: false},
                            {key: "date",	        score_value: 1,     selected: false},
                            {key: "format",	        score_value: 1,     selected: false},
                            {key: "type",	        score_value: 1,     selected: true},
                            {key: "subgenre",	    score_value: 1,     selected: true},
                            {key: "motif",	        score_value: 1,     selected: true},
                            {key: "literary",	    score_value: 1,     selected: true},
                            {key: "extreme",	    score_value: 1,     selected: true},
                            {key: "named_entity",	score_value: 1,     selected: true},
                            {key: "named_entity_location",	score_value: 1,     selected: true},
                            {key: "place_of_action",   score_value: 1,     selected: true},
                            {key: "corpus",	        score_value: 1,     selected: false},
//                            {key: "word_count",	score_value: 0,     selected: true},      //NEW
//                            {key: "word_count_group",   score_value: 1,     selected: true},      //NEW
                            {key: "tags",           score_value: 1,     selected: true},
                            {key: "text_length",      score_value: 1,     selected: false},
                            {key: "text_length_group",  score_value: 1,     selected: true},
                            {key: "location",	    score_value: 1,     selected: true},
                            {key: "sublocality",	score_value: 1,     selected: false},
                            {key: "locality",	    score_value: 1,     selected: false},
                            {key: "administrative_area_level_1",	score_value: 1,     selected: false},
                            {key: "administrative_area_level_2",	score_value: 1,     selected: false},
                            {key: "administrative_area_level_3",	score_value: 1,     selected: false},
                            {key: "country",        score_value: 1,     selected: false},
                            {key: "text",           score_value: 1,     selected: false}
                        ];


//"#E56717", "#E66C2C", "#F87217", "#F87431", "#E67451", "#FF8040", "#F88017", "#FF7F50", "#F88158", "#F9966B"
var metadatas_to_show = ["identifier", "title", "item_type", "subject",
                        "collector", "creator", "contributor", "date",
                        "subgenre", "type", "language", "literary", "extreme",
                        "tags", "named_entity","named_entity_location","place_of_action", "motif", 
                        "corpus","text_length","text_length_group", "locality", "description", "text"];


function array_color_generator(arr){
    scale_one = d3.scale.category10();
    console.log("scale one:")
    console.log(scale_one(0));
    group_colors = {};
    i = 0;
    for (param in arr){
        i++;
        group_colors[arr[param]] = scale_one(i);
    };
    return group_colors;
}

//Generate these
text_length_group_colors = { "<25": "#E56717",
                    "25-100": "#FF7F50",
                    "100-250": "#E55451",
                    "250-500": "#E42217",
                    "500-1000": "#9F000F",
                    ">1000": "#800517"};

language_colors = { "Standaardnederlands": "#00BFFF",
                    "Fries": "#DAA520",
                    "Gronings": "#7FFF00",
                    "Drents": "#D2B48C",
                    "Vlaams": "#556B2F",
                    "personal_narrative": "#DA70D6",
                    "legende": "#6A5ACD",
                    "exempel": "#FFA500",
                    "mythe": "#555555",
                    "lied": "#FF00FF",
                    "kwispel": "#FF0066",
                    "other": "#FF0000",
                    "personal": "#FF00FF",
                    "none": "#FFFFE0"};

types = ["almanak",
        "artikel",
        "boek",
        "brief",
        "cd",
        "centsprent",
        "drama",
        "e-mail",
        "fax",
        "handschrift",
        "internet",
        "kluchtboek",
        "krant",
        "lp",
        "mondeling",
        "televisie",
        "vragenlijst",
        "informatiebord"];

type_colors = array_color_generator(types);
console.log(type_colors);

subgenre_colors = { "broodjeaapverhaal": "#00BFFF",
                    "sprookje": "#DAA520",
                    "mop": "#7FFF00",
                    "sage": "#D2B48C",
                    "raadsel": "#556B2F",
                    "personal_narrative": "#DA70D6",
                    "legende": "#6A5ACD",
                    "exempel": "#FFA500",
                    "mythe": "#555555",
                    "lied": "#FF00FF",
                    "kwispel": "#FF0066",
                    "other": "#FF0000",
                    "personal": "#FF00FF",
                    "none": "#FFFFE0"};

extreme_colors = { "ja": "#00BFFF",
                    "nee": "#555555",
                    "none": "#FFFFE0"};


literary_colors = { "ja": "#00BFFF",
                    "nee": "#555555",
                    "none": "#FFFFE0"};

legendOptionValues = ["subgenre", "type", "language", "literary", "extreme", "text_length_group"];
selectedLegendOptionValue = "";

//var facet_addition = "&facet=true&facet.mincount=1&wt=json&rows=0&facet.field=" + show_facets.join("&facet.field=")

//var initial_id_search = "19199"; //nederlandermop

var id_search_query;

var id_search_command = id_search_proxy + id_search_query;

var vb_search_link = "";

var solr_search_command = "";

var initial_neighbor_search = "";
var neighbor_search_query = initial_neighbor_search;
var neighbor_search_command = neighbor_search_proxy + neighbor_search_query;

var network_graph = {"nodes" : [], "links": []};
var network_nodes = [];
var network_links = [];
var network_special_links = [];

var interconnect_minimum_score = 2; //solr score
var max_nodes_size = 30;

var max_neighbor_results = 25;
var min_neighbor_score = 3.2;

//some view settings
var links_same_size = false;
var links_width = 5;

var nodes_same_size = false;
var nodes_size = 15;

var title_in_node = true;
var show_dragbubbles = true;

var link_colors_by_score_strength = true;

var node_params = {
    charge: { min: -10000, max: 500, step: 5, value: -420 },
    linkDistance: { min: 0, max: 1000, step: 5, value: 50 },
    distance: { min: 0, max: 1000, step: 5, value: 50 },
    linkStrength: { min: 0, max: 1, step: 0.05, value: 1 },
    gravity: { min: -0.0, max: 0.8, step: 0.01, value: 0.2 },
    friction: { min: 0, max: 1, step: 0.05, value: 0.8 },
    theta: { min: 0, max: 1, step: 0.05, value: 0.5 },
};

function ViewModel() {
    
    var self = this;
    
    //if the system is waiting for something
    self.waiting = ko.observable(waiting);
    
    //view settings
    self.interconnect_minimum_score = ko.observable(interconnect_minimum_score);

    self.link_colors_by_score_strength = ko.observable(link_colors_by_score_strength);
    self.links_same_size = ko.observable(links_same_size);
    self.nodes_same_size = ko.observable(nodes_same_size); //if false, size according to word_count. if number, node size

    self.title_in_node = ko.observable(title_in_node);
    self.show_dragbubbles = ko.observable(show_dragbubbles);
    self.links_width = ko.observable(links_width);
    self.nodes_size = ko.observable(nodes_size);
    self.max_nodes_size = ko.observable(max_nodes_size);

    self.show_help_windows = ko.observable(show_help_windows);
    self.show_info_windows = ko.observable(show_info_windows);

    self.all_selected = ko.observable(false);

    self.build_tree = ko.observableArray(legendOptionValues);
    self.selectedLegendOptionValue = ko.observableArray(selectedLegendOptionValue);

    self.node_params = ko.observable(node_params);

    for (param in self.node_params()){
//        console.log(param);
        self.node_params()[param].value = ko.observable(self.node_params()[param].value);
    }; //replace all values with observables


    //data settings
    ko.utils.arrayForEach(metadatas_to_query, function(select) {
        select.selected = ko.observable(select.selected);
        select.score_value = ko.observable(select.score_value);
    }); //replace all selected with observables

    self.metadatas_to_query = ko.observable(metadatas_to_query);

    self.metadatas_to_show = ko.observable(metadatas_to_show);    
    
    self.subgenre_colors = ko.observable(subgenre_colors);

    //observable arrays for containing search/browse results
    self.facets_results = ko.observableArray([]);
    self.id_search_result = ko.observableArray([]);
    self.neighbor_search_results = ko.observableArray([]);
    self.build_tree = ko.observableArray([]);
    
    self.network_graph = ko.observable(network_graph); //use this one for full refresh
    self.network_special_links = ko.observableArray([]);

    //keeping track of selected objects
    self.selected_nodes = ko.observableArray([]);
    
    //queries
    self.vb_search_link = ko.observable(vb_search_link);
    self.solr_search_command = ko.observable(solr_search_command);
    
    self.id_search_query = ko.observable(id_search_query);
    self.id_search_command = ko.observable(id_search_command);

    self.neighbor_search_query = ko.observable(neighbor_search_query);
    self.neighbor_search_command = ko.observable(neighbor_search_command);
    
    self.facet_search_query = ko.observable(neighbor_search_query);
    self.facet_search_command = ko.observable(neighbor_search_command);

    self.max_neighbor_results = ko.observable(max_neighbor_results);
    self.min_neighbor_score = ko.observable(min_neighbor_score);
    
    //internal check variables
    
    self.n_n_depth = ko.observable(n_n_depth);

    self.removeNode = function(index){
        //remove node
        removed_item = self.network_graph().nodes.splice(index, 1);
        //remove links
        removeLinks(removed_item[0], self);
        console.log(self.network_graph());
        self.network_graph.valueHasMutated();
    };

    self.doFacetRetrieve = function(){
        self.facet_query = facet_proxy + self.initial_facet_query();
    };

    self.killSelectedNodes = function(){
        RemoveSelectedNodes(self); //moeilijke klus.
    }

    self.killLonelyNodes = function(){
        RemoveLonelyNodes(self); //moeilijke klus.
    }
    
    self.neighborsExpand = function(item){
//        self.waiting(true);
        NeighborNeighbor(1, self.max_neighbor_results(), self.min_neighbor_score(), self);
//        self.waiting(false);
    };

    self.doNeighborSearch = function(item){
//        console.log(item);
        NeighborSearch(item, self.max_neighbor_results(), self.min_neighbor_score(), self);
    };
    
    self.connectNeighbors = function(item){
        self.waiting(true);
        setTimeout(function(){
            ConnectNeighbors(self)
//            ConnectNeighborsEXPENSIVE(self) //exhaustive search
        }, 200);
        setTimeout(function(){
            self.waiting(false);
        }, self.network_graph()["nodes"].length * 40);
        
    };

    self.ConsSearch = function (id) {
        self.clearData();
        self.id_search_query(id);
        self.doIdSearch();
    };

    self.doVBSearch = function () {
        self.clearData();
        
        search_these = get_vb_id_list(self.vb_search_link());
        self.id_search_query(search_these);

        self.doIdSearch();
    };

    self.doSolrSearch = function () {
        self.clearData();
        
        var collection = "collection_id:1";
        var return_fields = "fl=id,identifier";
        
        get_id_list_command = solr_search_proxy + self.solr_search_command() + "&" + collection + "&" + return_fields;
//        console.log(get_id_list_command);
        
        search_these = get_solr_id_list(get_id_list_command);
        self.id_search_query(search_these);

        self.doIdSearch();
    };

    self.doIdSearch = function () {
        self.clearData();
        ids = self.id_search_query().split(/,[ \n]*/);
        for (id in ids){
            UpdateNetworkData(id_search_proxy + ids[id], true, self);
        }
    };

    self.doFacetSearch = function (){
        facet_query = "";
        var or = "";
        if (self.selected_nodes()){
                $.each(self.selected_nodes(), function(index, value) {
//                    console.log(value.id);
                    facet_query += or + "id" + ":\"" + value.id + "\"";
                });
                or = " OR ";
        }
        total_facet_query = facet_proxy + facet_query + facet_addition;
//        console.log(total_facet_query);
        UpdateFacetData(total_facet_query, self);
    }

    self.doIdAdd = function () {
        console.log("searching id number");
        UpdateNetworkData(id_search_proxy + self.id_search_query(), true, self);
    };

    self.emptySolrSearchbox = function(){
        self.vb_search_link("");
    };

    self.emptyVBSearchbox = function(){
        self.vb_search_link("");
    };
    
    self.emptySearchbox = function(){
        self.id_search_query("");
    };

    self.searchKeyboardCmdVB = function (data, event) {
        if (event.keyCode == 13) self.doVBSearch();
        return true;
    };

    self.searchKeyboardCmdSolR = function (data, event) {
        if (event.keyCode == 13) self.doSolrSearch();
        return true;
    };

    self.searchKeyboardCmd = function (data, event) {
        if (event.keyCode == 13) self.doIdSearch();
        return true;
    };
    
    self.clearData = function (){
        self.network_graph({"nodes": [], "links": []});
        self.network_special_links([]);
    };
    
    self.all_checked = ko.computed({
        read: function() {
        },
        write: function(value) {
            ko.utils.arrayForEach(self.metadatas_to_query(), function(item) {
                item.selected(value);
            });
        }
    });
    
    self.location_checked = ko.computed({
        read: function() {
        },
        write: function(value) {
            location_metas = ["locality"];
            ko.utils.arrayForEach(self.metadatas_to_query(), function(item) {
                if ($.inArray(item.key, location_metas)){ 
                    item.selected(true);
                }
            });
        }
    });
    
    self.content_checked = ko.computed({
        read: function() {
        },
        write: function(value) {
            ko.utils.arrayForEach(self.metadatas_to_query(), function(item) {
                item.selected(value);
            });
        }
    });
    
    self.involved_checked = ko.computed({
        read: function() {
        },
        write: function(value) {
            ko.utils.arrayForEach(self.metadatas_to_query(), function(item) {
                item.selected(value);
            });
        }
    });
    
};

function removeLinks(item, vm){
    console.log("removing links: " + item.node_id);
    for (link in vm.network_graph().links){
//        console.log(vm.network_graph().links[link]);
        if ((vm.network_graph().links[link].source.id == item.id) || (vm.network_graph().links[link].target.id == item.id)) {
            vm.network_graph().links.splice(link, 1);
        }
    }
}


function get_solr_id_list(solr_query){
    search_ids = [];
    $.ajax({
        url: solr_query,
        async: false, // meh
        dataType: "json",
        success: function(response) {
            if (response.response.docs.length > 0){ //if there is a response
                found_nodes = response.response.docs;
                for (node in found_nodes){
                    search_ids.push(found_nodes[node].id);
                }
            }
        },
    });
    search_string = search_ids.join(",");
    console.log(search_string);
    return search_string;
}

function get_vb_id_list(vb_link){
    var search_string;
    page = 0;
    all_items_found = false;
    items_found = 0;
    vb_link = vb_link + "&output=json";
    search_ids = [];
    while (!all_items_found){
        page++;
        vb_link = vb_link + "&page=" + page;
        console.log(vb_link);
        $.ajax({
            url: vb_link,
            async: false, // meh
            dataType: "json",
            success: function(response) {
                if (response.total_results > 0){ //if there is a response
                    total_results = response.total_results;
                    for (i in response.items){
                        items_found++;
                        if (response.items[i].id){
                            setTimeout(search_ids.push(response.items[i].id),1000)
//                            search_ids.push(response.items[i].id);
                        }
                    }
                }
                if (items_found >= response.total_results - 1){
                    all_items_found = true;
                }
            },
            error: function(){
                all_items_found = true; //or it will just keep going!
            }
        });
    }
    search_string = search_ids.join(",");
    return search_string;
}

function search(_for, _in) {
    var r;
    for (var p in _in) {
        if ( p === _for ) {
            return _in[p];
        }
        if ( typeof _in[p] === 'object' ) {
            if ( (r = search(_for, _in[p])) !== null ) {
                return r;
            }
        }
    }
    return null;
}

function search_id(needle, haystack) {
    // iterate over each element in the array
    console.log(needle);
    console.log(haystack);
    if (haystack.id == needle){ //start at the root
        // we found it
        return haystack;
    }
    for (var child in haystack.children){
        // look for the entry with a matching `code` value
        console.log(haystack.children[child].id);
        if (haystack.children[child].id == needle){
            // we found it
            return haystack.children[child];
        }      
        if (haystack.children[child].children) {
            if ( (r = search(needle, haystack.children[child])) !== null ) {
                return r;
            }
        }
    }
    console.log(needle + " not found");
    return null; //nope
}

function NeighborNeighbor(n, max_neighbor_results, min_neighbor_score, vm){
//    if (n_n_depth < 3){ //saving your computer
    if (vm.network_graph().nodes.length < 150){ //saving your computer
        existing_network_graph = vm.network_graph();
        for (var i = 0; i < n ; i++) {
            console.log("expanding all nodes - " + i);
            vm.n_n_depth(vm.n_n_depth () + 1);
            for (item in existing_network_graph.nodes){
                NeighborSearch(existing_network_graph.nodes[item], max_neighbor_results, min_neighbor_score, vm)
            }
        }
    }
}

function generate_item_query(item){
    var or_pre_query = [];
    queryable = [];
    scores = [];
    $.each(item, function(index, value) {
        $.each(metadatas_to_query, function(metaindex, metavalue){
            if ((metavalue.key == index) && (metavalue.selected() == true)){
                if ($.isArray(value)){
                    $.each(value, function(subindex, subvalue){
                        or_pre_query.push(index + ":\"" + subvalue + "\"" + "^" + metavalue.score_value());
                    });
                }
                else{
                    or_pre_query.push(index + ":\"" + value + "\"" + "^" + metavalue.score_value());
                }
            }
        });
    });
//    console.log(or_pre_query);
    return or_pre_query;
}

function create_search_command_from_item_id_return(item, max_neighbor_results, vm){
    var or_pre_query = generate_item_query(item);
    var additional = "&start=0&rows=" + max_neighbor_results;
    additional += "&fl=score,id"; 
    var neighbor_search_query = or_pre_query.join(" OR ");// + counter_identical_return;
    var neighbor_search_command = neighbor_search_proxy + neighbor_search_query + additional;
    return neighbor_search_command;
}

function create_search_command_from_item(item, max_neighbor_results, vm){
//    console.log("create_search_command_from_item");
    var or_pre_query = generate_item_query(item);
//    var counter_identical_return = " AND -id:" + item.id; //never find the same back directly
    var additional = "&start=0&rows=" + max_neighbor_results;
    var neighbor_search_query = or_pre_query.join(" OR ");// + counter_identical_return;
    var neighbor_search_command = neighbor_search_proxy + neighbor_search_query + additional;
//    console.log(neighbor_search_command);
    return neighbor_search_command;
}


//search for al the neighbors of a specific item and create a link
function NeighborSearch(item, max_neighbor_results, min_neighbor_score, vm){
    
    var neighbor_search_command = create_search_command_from_item(item, max_neighbor_results, vm);
    
    existing_network_graph = vm.network_graph();
    amount_nodes = existing_network_graph.nodes.length;

    $.getJSON(neighbor_search_command, function(response) {

//        vm.neighbor_search_results(response.response.docs);
        
        for (i in response.response.docs){
            if ((!inNodesList(response.response.docs[i], existing_network_graph.nodes)) && (response.response.docs[i].score > vm.min_neighbor_score())){
                pre_node = response.response.docs[i];
                pre_node["node_id"] = amount_nodes; //extra id for flattening
                existing_network_graph.nodes.push(pre_node);
                var push_link = {"source": item.node_id, "target": pre_node.node_id, "score": pre_node.score};
                existing_network_graph.links.push(push_link);
                amount_nodes += 1;
            }
        }

        vm.network_graph(existing_network_graph);
//        vm.network_graph.valueHasMutated();
    });
}

function create_comparison_search_command_from_item(item, id, vm){
//    console.log("create_search_command_from_item");
    var or_pre_query = generate_item_query(item);
//    var counter_identical_return = " AND -id:" + item.id; //never find the same back directly
    var fq_id_addition = "&fq=id:" + id;
    var neighbor_search_query = or_pre_query.join(" OR ");// + counter_identical_return;
    var neighbor_search_command = neighbor_search_proxy + neighbor_search_query + fq_id_addition;
//    console.log(neighbor_search_command);
    return neighbor_search_command;
}

function ConnectNeighbors(vm){
    console.log("connecting nodes");
    existing_network_graph = vm.network_graph();
    node_ids = returnNodeIds(existing_network_graph.nodes);
    existing_network_graph.links = []; //complete refresh
    changed = false
    for (var i = 0; i < existing_network_graph.nodes.length; i++) {

        var neighbor_search_command = create_search_command_from_item_id_return(existing_network_graph.nodes[i], 100, vm);

        $.ajax({
            url: neighbor_search_command,
            async: false, // meh
            dataType: "json",
            success: function(response) {
                if (response.response.docs.length > 0){ //if there is a response
                    changed = true;
                    found_nodes = response.response.docs;
                    for (node in found_nodes){
                        if (existing_network_graph.nodes[i].id == found_nodes[node].id){ } //when the id's are the same (link to itself) do nothing
                        else if ($.inArray(found_nodes[node].id, node_ids)){ 
                            if (found_nodes[node].score > vm.min_neighbor_score() ){ //if the document score is high enough
                                found_node_internal_id = returnInternalNodeIdById(found_nodes[node].id, existing_network_graph.nodes);
                                if (found_node_internal_id){ //extra check
                                    //ADD!!: try to search for reverse link. if found, take highest scoring link.
                                    var push_link = {"source": existing_network_graph.nodes[i].node_id, "target": found_node_internal_id, "score": found_nodes[node].score};
                                    existing_network_graph.links.push(push_link);
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    if (changed){ vm.network_graph(existing_network_graph); }
}

function RemoveLonelyNodes(vm){
    existing_network_graph = vm.network_graph();
    lonely_nodes = [];
    //first identify:
    for (var i = 0; i < existing_network_graph.nodes.length; i++) {
        if (!singleNodeinLinkList(existing_network_graph.nodes[i], existing_network_graph.links)){
//            console.log("removing node " + i)
            lonely_nodes.push(i);
            existing_network_graph.nodes.splice(i, 1);
        }
    }
//    existing_network_graph.links = []; //no longer necessary (node update fixed)
    //reset the node_ids?
    for (var i = 0; i < existing_network_graph.nodes.length; i++) {
        existing_network_graph.nodes[i].node_id = i;
    }
    vm.network_graph(existing_network_graph);
    vm.network_graph.valueHasMutated();
    //then remove:
    //            existing_network_graph.nodes.splice(i, 1);
    
}

function RemoveSelectedNodes(vm){
    existing_network_graph = vm.network_graph();
    selected_nodes = vm.selected_nodes();
    //first identify:
    console.log(existing_network_graph);
    for (var q = 0; q < selected_nodes.length; q++) { //not surewhy, but this has to be repeated a bunch of times
        for (var i = 0; i < existing_network_graph.nodes.length; i++) {
            for (var j = 0; j < selected_nodes.length; j++) {
                if (selected_nodes[j] == existing_network_graph.nodes[i])
                    existing_network_graph.nodes.splice(i, 1);
            }
        }
        for (var i = 0; i < existing_network_graph.links.length; i++) {    
            for (var j = 0; j < selected_nodes.length; j++) {
                if (selected_nodes[j] == existing_network_graph.links[i].source)
                    existing_network_graph.links.splice(i, 1);
            }
        }
        for (var i = 0; i < existing_network_graph.links.length; i++) {    
            for (var j = 0; j < selected_nodes.length; j++) {
                if (selected_nodes[j] == existing_network_graph.links[i].target)
                    existing_network_graph.links.splice(i, 1);
            }
        }
    }

    //reset the node_ids?
    for (var i = 0; i < existing_network_graph.nodes.length; i++) {
        existing_network_graph.nodes[i].node_id = i;
    }
    //remove unconnected links
    
    
    vm.network_graph(existing_network_graph);
    vm.network_graph.valueHasMutated();
}

function remove_unconnected_links(){
    
}

function returnNodeIds(nodes){
    node_ids = [];
    for (node in nodes){
        node_ids.push(nodes[node].id);
    }
    return node_ids;
}

function returnInternalNodeIdById(id, nodes){
    for (nodeid in nodes){
        if (nodes[nodeid].id == id){
            return nodes[nodeid].node_id; //of gewoon node?
        }
    }
    return false;
}

function singleNodeinLinkList(i, linkList){ //only one way searching
    for (l in linkList){
        if (i.id == linkList[l].source.id){
            return i.id;
        }
        if (i.id == linkList[l].target.id){
            return i.id;
        }
    }
    return false;
}

function inLinkList(i, i2, linkList){ //only one way searching
    for (l in linkList){
        if ((i.id in linkList[l].source) && (i2.id in linkList[l].target)){
            return true;
        }
        if ((i2.id in linkList[l].source) && (i.id in linkList[l].target)){
            return true;
        }
    }
    return false;
}

function inNodesList(item, list){
    for (l in list){
        if (item.id == list[l].id){
            return true;
        }
    }
    return false;
}

function ConnectNeighborsEXPENSIVE(vm){
    console.log("connecting nodes");
    existing_network_graph = vm.network_graph();
    existing_network_graph.links = []; //complete refresh
    for (var i = 0; i < existing_network_graph.nodes.length; i++) { 
        for (var i2 = i; i2 < existing_network_graph.nodes.length; i2++) { 
            var neighbor_search_command = create_comparison_search_command_from_item(existing_network_graph.nodes[i], existing_network_graph.nodes[i2].id, vm);
            $.ajax({
                url: neighbor_search_command,
                async: false, // meh
                dataType: "json",
                success: function(response) {
                    if (response.response.docs.length >0){
                        found_node = response.response.docs[0];
                        if (found_node.score > vm.min_neighbor_score() ){ //sometimes flips out...?
                            var push_link = {"source": existing_network_graph.nodes[i].node_id, "target": existing_network_graph.nodes[i2].node_id, "score": found_node.score};
                            existing_network_graph.links.push(push_link);
                        }
                    }
                }
            });
        }
    }
    vm.network_graph(existing_network_graph);
}

function d3_format_facets(raw_facets){
    var formatted_facets = {}
    for(var index in raw_facets) { 
        var attr = raw_facets[index];
        var list = {};
        for (var val in raw_facets[index]){
            if (typeof attr[val] == "string"){
                list[attr[val]] = attr[parseInt(val) + 1];
            }
        }
        formatted_facets[index] = d3.entries(list);
    }
    return d3.entries(formatted_facets);
}


function UpdateFacetData(facet_query, vm){
//    console.log(facet_query);
    $.getJSON(facet_query, function(response) {
//        var this_facets_results = vm.facets_results;
        formatted_response = d3_format_facets(response.facet_counts.facet_fields);
        vm.facets_results(formatted_response);
        vm.facets_results.valueHasMutated();
    });
}

function UpdateNetworkData(command, add, vm){
    n_n_depth = 0;
//    console.log(command);
    var existing_network_graph = vm.network_graph();
    $.getJSON(command, function(response) {
        pre_node = response.response.docs[0];
        if (add && !inNodesList(pre_node, existing_network_graph.nodes)){
            pre_node["node_id"] = existing_network_graph.nodes.length; //extra id for flattening
            existing_network_graph.nodes.push(pre_node)
        }
        else if (add && inNodesList(pre_node, existing_network_graph.nodes)){
            //do nothing
        }
        else{
            pre_node["node_id"] = 0; //extra id for flattening
            base_node = {"nodes" : [pre_node], "links": []};
            vm.network_graph(base_node);
        }
        vm.network_graph.valueHasMutated();
//        console.log("created root node network");
    });
}


function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}

function MenuViewer(vm){

    this.init = function(){
        $(function() {
          $( "#tabs" ).tabs();
        });
        
        $(function() {
            $( "#accordion" ).accordion({
                heightStyle: "fill"
            });
        });
        
        $(function() {
            $( "#accordion-resizer" ).resizable({
                grid: 50,
                resize: function() {
                    $( "#accordion" ).accordion( "refresh" );
                }
            });
        });
        
        $(function() {
            $( "#slider" ).slider();
        });
        
        $(function() {
            $( "#spinner" ).spinner();
        });
        
        $('.controls div').each(function() {
            var param = $(this).attr('id');
            console.log(param);
            console.log(vm.node_params()[param].value());
            $(this).slider({
                slide: onSlide(param),
                min: vm.node_params()[param].min,
                max: vm.node_params()[param].max,
                step: vm.node_params()[param].step,
                value: vm.node_params()[param].value()
            });
        });
        
        function onSlide(param) {
            console.log(param);
            return function(e, ui) {
                $(this).closest('li').find('.value').text(ui.value);
                console.log(param);
                console.log(vm.node_params()[param].value());
                vm.node_params()[param].value(ui.value);
                vm.node_params.valueHasMutated();
            };
        }
    }
}

//fires when the system is waiting for data (location data, since this loads the longest by far)
function WaitViewer(vm){

    var waiting = false;
    
    this.init = function(waiting){
        
        check_for_wait();
        
        vm.show_info_windows.subscribe( function (){
            if (vm.show_info_windows()){
                $(".viewer").toggle("explode");
            }
            else{
                $(".viewer").toggle("explode");
            }
        });
        
//        $(".info").toggle("explode"); //start toggled
        vm.show_help_windows.subscribe( function (){
            if (vm.show_help_windows()){
                $(".info").toggle("explode");
            }
            else{
                $(".info").toggle("explode");
            }
        });
        
        vm.waiting.subscribe( function (){
            waiting = vm.waiting();
            check_for_wait();
        });
            
        function check_for_wait(){    
            if (vm.waiting()){
                d3.select("#waitWindow")
                    .style("opacity", 1)
                    .style("background", "green")
                    .transition()
                    .delay(100)
                    .style("visibility", "visible");
            }
            else {
                d3.select("#waitWindow")
                    .transition()
                    .duration(100)
                    .style("opacity", 0)
                    .transition()
                    .delay(100)
                    .style("visibility", "hidden");
            }
        }
    }
}