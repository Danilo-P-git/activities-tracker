<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EventGroupStaff extends Model
{
    use SoftDeletes;

    protected $table = 'event_group_staff';

    protected $fillable = [
        'event_id',
        'group_id',
        'staff_id',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
