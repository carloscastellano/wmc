import namespace from 'mapea-util/decorator';

@namespace("M.impl.layer")
export class WMCLayer extends M.impl.layer.WMC {

    /**
     * @classdesc
     * Extensión de la implementación de la capa WMC para poder insertar capas WMC que no vengan por url
     *
     * @constructor
     * @extends {M.impl.layer.WMC}
     * @api stable
     */
    constructor(options) {
        super(options);
        this.projection = null;
    }

    /**
     * This function select this WMC layer and
     * triggers the event to draw it
     *
     * @public
     * @function
     * @api stable
     */
    select() {
        if (this.selected === false) {
            // unselect layers
            this.map.getWMC().forEach((wmcLayer) => {
                wmcLayer.unselect();
            });

            this.selected = true;
            // set projection with the wmc
            if (this.projection) {
                this.map.setProjection({
                    "code": this.projection.getCode(),
                    "units": this.projection.getUnits()
                }, true);
            }
            if (!M.utils.isNullOrEmpty(this.bbox)) {
                this.map.setBbox(this.bbox, {
                    'nearest': true
                });
            }
            if (!M.utils.isNullOrEmpty(this.maxExtent)) {
                this.map.setMaxExtent(this.maxExtent, false);
            }
            if (this.layers.length) {
                this.map.addWMS(this.layers, true);
            }
            this.map.fire(M.evt.CHANGE_WMC, this);

        };
    }

    loadContext(documentXML) {
        return new Promise((success, fail) => {
            try {
                if (documentXML) {
                    //JGL: mapea5 incluye WMC y WMC110 dentro del array wmc
                    var formater = M.impl.format.wmc ? new M.impl.format.wmc.WMC() : new M.impl.format.WMC();
                    const context = formater.readFromDocument(documentXML);
                    success(context);
                } else if (this.url) {
                    // Carga el contexto
                    M.remote.get(this.url).then((response) => {
                        var wmcDocument = response.xml;
                        //JGL: mapea5 incluye WMC y WMC110 dentro del array wmc
                        var formater = M.impl.format.wmc ? new M.impl.format.wmc.WMC() : new M.impl.format.WMC();
                        var context = formater.readFromDocument(wmcDocument);
                        success(context);
                    });
                } else {
                    fail('No hay contexto');
                }
            } catch (error) {
                fail(error);
            }
        });
    }


    loadLayers() {
        if (this.map) {
            this.map.addWMS(this.layers, true);
        }
    }

    loadContextParameters(context) {
        this.layers = context.layers;
        // Debido a que en Mapea si no hay capas base se selecciona como activa la primera que llegue y las demás se desactivan
        // hay que reordenar el array de capas base para que las visibles se añadan primero
        this.layers.sort((layerA, layerB) => {
            const visibleA = layerA.isVisible();
            const visibleB = layerB.isVisible();
            const isBaseLayerA = !layerA.transparent;
            const isBaseLayerB = !layerB.transparent;
            // Si ambas son visible, o no visibles, o alguna de las dos no es base no se ordenan
            if ((visibleA && visibleB) || (!visibleA && !visibleB) || !isBaseLayerA || !isBaseLayerB) {
                return 0;
            } else if (visibleA) {
                return -1;
            } else {
                return 1;
            }

        });
        this.bbox = {
            'x': {
                'min': context.bounds[0],
                'max': context.bounds[2]
            },
            'y': {
                'min': context.bounds[1],
                'max': context.bounds[3]
            }
        };
        this.maxExtent = {
            'x': {
                'min': context.maxExtent[0],
                'max': context.maxExtent[2]
            },
            'y': {
                'min': context.maxExtent[1],
                'max': context.maxExtent[3]
            }
        };;
        this.projection = ol.proj.get(context.projection);
    }



}

// this.loadContextPromise.then((context) => {
//     // set projection with the wmc
//     if (this.map._defaultProj) {
//         var olproj = ol.proj.get(context.projection);
//         this.map.setProjection({
//             "code": olproj.getCode(),
//             "units": olproj.getUnits()
//         }, true);
//     }
//     // load layers
//     this.loadContextParameters(context);
//     if (!M.utils.isNullOrEmpty(bbox)) {
//         this.map.setBbox(bbox, {
//             'nearest': true
//         });
//     }
//     this.map.fire(M.evt.CHANGE_WMC, this);
// });