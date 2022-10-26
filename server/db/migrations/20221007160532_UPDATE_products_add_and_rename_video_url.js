const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.products, (t) => {
        t.renameColumn('video_url', 'youtube_video_url');
        t.jsonb('video').nullable();
    });
};

exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.products, (t) => {
        t.renameColumn('youtube_video_url', 'video_url');
        t.dropColumn('video');
    })
};
