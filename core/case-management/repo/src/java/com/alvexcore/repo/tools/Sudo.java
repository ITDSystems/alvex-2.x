package com.alvexcore.repo.tools;

import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

public class Sudo extends BaseScopableProcessorExtension {
    public void sudo(final Function func) {
        final Context cx = Context.getCurrentContext();
        final Scriptable scope = getScope();
 
        RunAsWork<Object> raw = new RunAsWork<Object>() {
            public Object doWork() throws Exception {
                func.call(cx, scope, scope, new Object[] {});
                return null;
            }
        };
 
        AuthenticationUtil.runAs(raw, AuthenticationUtil.getAdminUserName());
    }
}