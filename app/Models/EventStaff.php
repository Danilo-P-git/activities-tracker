<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\SoftDeletes;

class EventStaff extends Pivot
{
    use SoftDeletes;
    protected $table = 'event_staff';
    // La tabella ha un id auto-increment: necessario per save/update diretti
    public $incrementing = true;
    protected $primaryKey = 'id';
    protected $dates = ['added_at', 'removed_at', 'deleted_at'];
    protected $fillable = [
        'event_id',
        'staff_id',
        'added_at',
        'removed_at',
        'status',
    ];

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function breaks()
    {
        return $this->hasMany(\App\Models\StaffBreak::class, 'event_staff_id');
    }
}
