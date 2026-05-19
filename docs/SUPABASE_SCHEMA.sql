-- Brain Bugs — Supabase Database Schema
-- Run this script in your Supabase SQL Editor to set up the database tables and Row Level Security.

-- 1. PARENTS TABLE
-- References Supabase Auth.users
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Parents
CREATE POLICY "Allow parents to select their own profile"
    ON public.parents FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Allow parents to insert their own profile"
    ON public.parents FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow parents to update their own profile"
    ON public.parents FOR UPDATE
    USING (auth.uid() = id);


-- 2. CHILDREN PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.children (
    id VARCHAR(50) PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    nickname VARCHAR(100) NOT NULL,
    avatar_id VARCHAR(50) NOT NULL,
    bug_companion VARCHAR(50) NOT NULL,
    age_range VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    total_stars INTEGER DEFAULT 0 NOT NULL,
    total_xp INTEGER DEFAULT 0 NOT NULL,
    current_level INTEGER DEFAULT 1 NOT NULL,
    current_world VARCHAR(50) DEFAULT 'meadow' NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Children
CREATE POLICY "Allow parents to select their own children"
    ON public.children FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Allow parents to insert children for themselves"
    ON public.children FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Allow parents to update their own children"
    ON public.children FOR UPDATE
    USING (auth.uid() = parent_id);

CREATE POLICY "Allow parents to delete their own children"
    ON public.children FOR DELETE
    USING (auth.uid() = parent_id);


-- 3. PROGRESS RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.progress (
    child_id VARCHAR(50) PRIMARY KEY REFERENCES public.children(id) ON DELETE CASCADE,
    level_progress JSONB DEFAULT '{}'::jsonb NOT NULL,
    badges JSONB DEFAULT '[]'::jsonb NOT NULL,
    total_play_time INTEGER DEFAULT 0 NOT NULL,
    sessions JSONB DEFAULT '[]'::jsonb NOT NULL,
    activity JSONB DEFAULT '[]'::jsonb NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Progress
CREATE POLICY "Allow parents to select their children's progress"
    ON public.progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = progress.child_id AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Allow parents to insert progress for their children"
    ON public.progress FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = progress.child_id AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Allow parents to update progress for their children"
    ON public.progress FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = progress.child_id AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Allow parents to delete progress for their children"
    ON public.progress FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = progress.child_id AND children.parent_id = auth.uid()
        )
    );


-- 4. HELPER INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);
