<template>
    <v-app class="blue" dark>
        <v-content>
            <v-layout>
                <v-flex>
                    <v-list class="yellow lighten-2" dark style="padding:0">
                        <v-list-tile>
                            <v-list-tile-content>
                                <v-flex row>
                                    <v-btn fab flat small @click="switchGroups" v-if="!showGroups">
                                        <v-icon>arrow_back</v-icon>
                                    </v-btn>
                                    <v-btn fab flat small @click="showNewInput = true">
                                        <v-icon>add</v-icon>
                                    </v-btn>
                                </v-flex>
                            </v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile v-if="showNewInput">
                            <v-list-tile-content>
                                <v-flex style="width:100%">
                                    <v-text-field
                                        v-model="newValue"
                                        placeholder="New Item"
                                        @blur="addItem"
                                        >
                                    </v-text-field>
                                </v-flex>
                            </v-list-tile-content>
                        </v-list-tile>
                        <template v-for="(item, idx) in items">
                            <v-list-tile :key="idx" v-listtouch="item" class="blue">
                                <v-list-tile-content>
                                    <v-flex style="width:100%">
                                        <v-text-field
                                            v-if="item.isEditing"
                                            v-model="item.value"
                                            ref="textfield"
                                            @blur="updateItem(item)"
                                            >
                                        </v-text-field>
                                        <v-card class="blue" dark v-else>
                                            <v-card-text class="px-0 pb-2">
                                                <span @click="switchInput(item)">{{ item.value }}</span>
                                            </v-card-text>
                                        </v-card>
                                    </v-flex>
                                </v-list-tile-content>
                            </v-list-tile>
                        </template>
                    </v-list>
                </v-flex>
            </v-layout>
        </v-content>
    </v-app>
</template>

<script>
/* eslint-disable no-console */

import db from './db';

export default {
    name: 'App',
    data () {
        return {
            items: [],
            showGroups: true,
            showNewInput: false,
            newValue: '',
            selectedGroupId: null,
        }
    },
    mounted () {
        this.fetchGroups();
    },
    directives: {
        listtouch: {
            inserted: (el, binding, vnode) => {
                let touchPosition = {
                    startX: null,
                    startY: null,
                    currentX: null,
                    currentY: null,
                };
                let halfWidth = parseInt(window.innerWidth / 2);
                el.addEventListener('touchstart', event => {
                    if (event.targetTouches.length == 1) {
                        let touch = event.targetTouches[0];
                        touchPosition.startX = touch.pageX;
                        touchPosition.startY = touch.pageY;
                    }
                });
                el.addEventListener('touchmove', event => {
                    if (event.targetTouches.length == 1) {
                        let touch = event.targetTouches[0];
                        touchPosition.currentX = touch.pageX;
                        touchPosition.currentY = touch.pageY;
                        if (touchPosition.currentX < touchPosition.startX) {
                            el.style['margin-left'] = '0px';
                            el.style['margin-right'] = parseInt(touchPosition.startX - touchPosition.currentX) + 'px';
                        } else {
                            el.style['margin-left'] = parseInt(touchPosition.currentX - touchPosition.startX) + 'px';
                            el.style['margin-right'] = '0px';
                        }
                    }
                });
                el.addEventListener('touchend', () => {
                    el.style['margin-left'] = '0px';
                    el.style['margin-right'] = '0px';
                    if (touchPosition.currentX < touchPosition.startX && touchPosition.startX - touchPosition.currentX > halfWidth) {
                        return vnode.context.removeGroup(binding.value);
                    }
                });
            }
        }
    },
    methods: {
        groupToItem (group) {
            return {
                id: group.id,
                value: group.name,
                sort: group.sort,
                isGroup: true,
                isEditing: false,
            };
        },
        itemToGroup (item) {
            return {
                id: item.id,
                name: item.value,
                sort: item.sort,
            };
        },
        taskToItem (task) {
            return {
                id: task.id,
                value: task.text,
                sort: task.sort,
                groupsId: task.groups_id,
                isGroup: false,
                isEditing: false,
            };
        },
        itemToTask (item) {
            return {
                id: item.id,
                text: item.value,
                sort: item.sort,
                groups_id: item.groupsId,
            };
        },
        switchGroups () {
            this.showGroups = true;
            this.selectedGroupId = null;
            this.fetchGroups();
        },
        switchTasks (id) {
            this.showGroups = false;
            this.selectedGroupId = id;
            this.fetchTasks(id);
        },
        switchInput (item) {
            item.isEditing = true;
            this.$nextTick( () => this.$refs.textfield[0].focus() );
        },
        fetchGroups () {
            this.items = []; // All clear necessary for remove item
            db.groups.where('deleted').equals(0).reverse().sortBy('sort').then( groups => {
                this.items = groups.map( group => { return this.groupToItem(group); } );
            }).catch( error => {
                console.log(error);
            });
        },
        fetchTasks (id) {
            db.tasks.where({ deleted: 0, groups_id: id }).reverse().sortBy('sort').then( tasks => {
                this.items = tasks.map( task => { return this.taskToItem(task); } );
            }).catch( error => {
                console.log(error);
            });
        },
        updateGroup (item) {
            let group = this.itemToGroup(item);
            db.groups.update(group.id, group).then( updated => {
                if (updated) {
                    item.isEditing = false;
                    this.fetchGroups();
                } else {
                    console.log('Error: db.groups.update()');
                }
            }).catch( error => {
                console.log(error);
            });
        },
        updateTask (item) {
            let task = this.itemToTask(item);
            db.tasks.update(task.id, task).then( updated => {
                if (updated) {
                    item.isEditing = false;
                    this.fetchTasks(task.groups_id);
                } else {
                    console.log('Error: db.groups.update()');
                }
            }).catch( error => {
                console.log(error);
            });
        },
        updateItem (item) {
            if (!this.showGroups && this.selectedGroupId) {
                this.updateTask(item);
            } else {
                this.updateGroup(item);
            }
        },
        clearNewInput () {
            this.showNewInput = false;
            this.newValue = '';
        },
        addGroup () {
            let group = {
                name: this.newValue,
                sort: this.items.length + 1,
                deleted: 0,
            };
            db.groups.add(group).then( () => {
                this.clearNewInput();
                this.fetchGroups();
            }).catch( error => {
                console.log(error);
            });
        },
        addTask () {
            let task = {
                groups_id: this.selectedGroupId,
                text: this.newValue,
                sort: this.items.length + 1,
                deleted: 0,
            };
            db.tasks.add(task).then( () => {
                this.clearNewInput();
                this.fetchTasks(this.selectedGroupId);
            }).catch( error => {
                console.log(error);
            });
        },
        addItem () {
            if (!this.newValue) {
                this.clearNewInput();
                return;
            }
            if (!this.showGroups && this.selectedGroupId) {
                this.addTask();
            } else {
                this.addGroup();
            }
        },
        removeGroup (item) {
            let group = this.itemToGroup(item);
            group.deleted = 1;
            db.transaction('rw', db.groups, () => {
                db.groups.update(group.id, group);
                db.groups.where('sort').above(group.sort).each( grp => {
                    db.groups.update(grp.id, { sort: grp.sort - 1 });
                });
            }).then( () => {
                this.fetchGroups();
            }).catch( error => {
                console.log(error);
            });
        },
        removeTask (item) {
            let task = this.itemToTask(item);
            task.deleted = 1;
            db.transaction('rw', db.tasks, () => {
                db.tasks.update(task.id, task);
                db.tasks.where('groups_id').equals(task.groups_id).filter( tsk => {
                    return tsk.sort > task.sort;
                }).each( tsk => {
                    db.tasks.update(tsk.id, { sort: tsk.sort - 1 });
                });
            }).then( () => {
                this.fetchTasks(task.groups_id);
            }).catch( error => {
                console.log(error);
            });
        },
        removeItem (item) {
            if (!this.showGroups && this.selectedGroupId) {
                this.removeTask(item);
            } else {
                this.removeGroup(item);
            }
        },
    }
}
</script>
